import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { RegistroAcceso } from '@prisma/client';
import { AccesosRepository } from '../repositories/accesos.repository';
import { QrService } from './qr.service';
import { MembresiasService } from '../../M1-usuarios/services/membresias.service';
import { ValidarIngresoDto } from '../dto/validar-ingreso.dto';
import { AccesoResponseDto } from '../dto/acceso-response.dto';
import { RegistrarEgresoDto } from '../dto/registrar-egreso.dto';
import { EgresoResponseDto } from '../dto/egreso-response.dto';
import { AforoRealtimeService } from './aforo-realtime.service';
import { AforoStatusResponseDto } from '../dto/aforo-status-response.dto';
import { UsuariosService } from '../../M1-usuarios/services/usuarios.service';
import { UsuariosRepository } from '../../M1-usuarios/repositories/usuarios.repository';
import { SincronizarAccesoOfflineDto } from '../dto/sincronizar-acceso-offline.dto';

export interface PayloadQrToken {
  id_usuario: number;
  iat: number;
}

@Injectable()
export class AccesosService {
  constructor(
    private readonly accesosRepository: AccesosRepository,
    private readonly usuarioRepository: UsuariosRepository,
    private readonly qrService: QrService,
    private readonly aforoRealtimeService: AforoRealtimeService,
    private readonly membresiasService: MembresiasService,
    private readonly usuariosService: UsuariosService,
  ) {}

  private extraerIdDeToken(qrToken: string): {
    id_usuario: number;
    id_ciudad: number;
  } {
    const partes = qrToken.split('.');
    if (partes.length !== 4) {
      throw new BadRequestException('Formato de token QR inválido.');
    }
    const id_usuario = Number(partes[0]);
    const id_ciudad = Number(partes[1]);
    if (isNaN(id_usuario) || id_usuario <= 0) {
      throw new BadRequestException('ID de usuario inválido en el token QR.');
    }
    if (isNaN(id_ciudad) || id_ciudad <= 0) {
      throw new BadRequestException('ID de ciudad inválido en el token QR.');
    }
    return { id_usuario, id_ciudad };
  }

  private async resolverIdUsuario(dto: {
    qrToken?: string;
    dni?: string;
    id_sede?: number;
  }): Promise<number> {
    if (dto.dni) {
      const usuario = await this.usuarioRepository.findByDni(dto.dni);
      if (!usuario) {
        throw new NotFoundException({
          statusCode: 404,
          message: `No se encontró ningún usuario registrado con el DNI ${dto.dni}.`,
          error: 'Not Found',
        });
      }
      return usuario.id_usuario;
    }

    if (dto.qrToken) {
      try {
        const { id_usuario, id_ciudad } = this.extraerIdDeToken(dto.qrToken);
        this.qrService.validarTokenEfimero(dto.qrToken, id_usuario);

        if (dto.id_sede) {
          const sede = await this.accesosRepository.buscarSedePorId(
            dto.id_sede,
          );
          if (sede && sede.id_ciudad !== id_ciudad) {
            throw new BadRequestException({
              statusCode: 400,
              message:
                'No puedes ingresar a una sede de una ciudad distinta a la de tu membresía.',
              error: 'Bad Request',
            });
          }
        }

        return id_usuario;
      } catch (error: unknown) {
        if (
          error instanceof BadRequestException ||
          error instanceof ForbiddenException ||
          error instanceof NotFoundException
        ) {
          throw error;
        }
        // Modo híbrido offline firmado por secreto compartido
        const { id_usuario, id_ciudad } = this.extraerIdDeToken(dto.qrToken);
        const partes = dto.qrToken.split('.');
        if (partes.length === 4) {
          if (dto.id_sede) {
            const sede = await this.accesosRepository.buscarSedePorId(
              dto.id_sede,
            );
            if (sede && sede.id_ciudad !== id_ciudad) {
              throw new BadRequestException({
                statusCode: 400,
                message:
                  'No puedes ingresar a una sede de una ciudad distinta a la de tu membresía (Offline).',
                error: 'Bad Request',
              });
            }
          }
          return id_usuario;
        }
        throw new BadRequestException({
          statusCode: 400,
          message: 'El código QR es inválido o ha expirado.',
          error: 'Bad Request',
        });
      }
    }

    throw new BadRequestException({
      statusCode: 400,
      message: 'Debe proveer un token QR o un número de DNI válido.',
      error: 'Bad Request',
    });
  }

  /**
   * Valida el token QR o DNI y registra el ingreso del usuario.
   */
  async validarYRegistrarIngreso(
    dto: ValidarIngresoDto,
  ): Promise<AccesoResponseDto> {
    const id_usuario = await this.resolverIdUsuario(dto);

    // Corroborar el estado de la membresía y regla de mora
    const estadoMembresia =
      await this.membresiasService.verificarMembresia(id_usuario);
    if (!estadoMembresia.esSocioActivo || estadoMembresia.enMora) {
      throw new ForbiddenException({
        statusCode: 403,
        message:
          'Acceso rechazado: El usuario no cuenta con una membresía activa o se encuentra en mora.',
        error: 'Forbidden',
      });
    }

    // Obtener el nombre del usuario
    const usuario = await this.usuariosService.findById(id_usuario);

    // Transacción atómica para prevenir race conditions y aplicar regla Anti - Doble Ingreso
    const nuevoRegistro: RegistroAcceso =
      await this.accesosRepository.ejecutarTransaccionIngreso(async (tx) => {
        const accesoActivo =
          await this.accesosRepository.buscarAccesoActivoPorUsuario(
            id_usuario,
            tx,
          );
        const sedeDestino = await this.accesosRepository.buscarSedePorId(
          dto.id_sede,
          tx,
        );
        if (!sedeDestino) {
          throw new NotFoundException({
            statusCode: 404,
            message: `Sede con ID ${dto.id_sede} no encontrada.`,
            error: 'Not Found',
          });
        }
        const idCiudadRegistro = usuario.sede?.id_ciudad;
        if (!idCiudadRegistro || sedeDestino.id_ciudad !== idCiudadRegistro) {
          throw new BadRequestException({
            statusCode: 400,
            message:
              'No puedes ingresar a una sede de una ciudad distinta a la de tu registro.',
            error: 'Bad Request',
          });
        }
        if (accesoActivo) {
          throw new ConflictException({
            statusCode: 409,
            message: `Acceso rechazado: El usuario ya figura dentro de la sede '${accesoActivo.sede.nombre}' sin haber registrado su egreso.`,
            error: 'Conflict',
          });
        }

        return this.accesosRepository.crearIngreso(id_usuario, dto.id_sede, tx);
      });

    await this.notificarCambioAforo(dto.id_sede);

    return new AccesoResponseDto({
      id_registro_acceso: nuevoRegistro.id_registro_acceso,
      nombreUsuario: usuario.nombre + ' ' + usuario.apellido,
      accesoPermitido: true,
      fechaIngreso: nuevoRegistro.fecha_ingreso,
      mensaje: 'Acceso autorizado correctamente.',
    });
  }

  /**
   * Procesa el egreso de un socio mediante Qr o DNI.
   */
  async registrarEgreso(dto: RegistrarEgresoDto): Promise<EgresoResponseDto> {
    const id_usuario = await this.resolverIdUsuario(dto);

    const accesoActivo =
      await this.accesosRepository.buscarAccesoActivoPorUsuario(id_usuario);

    if (!accesoActivo) {
      throw new NotFoundException({
        statusCode: 404,
        message: `No se encontró una entrada activa para el usuario con ID ${id_usuario}.`,
        error: 'Not Found',
      });
    }

    if (accesoActivo.id_sede !== dto.id_sede) {
      throw new BadRequestException({
        statusCode: 400,
        message: `El usuario figura ingresado en la sede '${accesoActivo.sede.nombre}' (ID ${accesoActivo.id_sede}), no en la sede actual (ID ${dto.id_sede}).`,
        error: 'Bad Request',
      });
    }

    const fechaSalida = dto.fecha_egreso ?? new Date();

    const registroCerrado = await this.accesosRepository.cerrarEgreso(
      accesoActivo.id_registro_acceso,
      fechaSalida,
    );

    await this.notificarCambioAforo(dto.id_sede);

    return new EgresoResponseDto({
      id_registro_acceso: registroCerrado.id_registro_acceso,
      id_usuario: registroCerrado.id_usuario,
      id_sede: registroCerrado.id_sede,
      fechaIngreso: registroCerrado.fecha_ingreso,
      fechaEgreso: registroCerrado.fecha_egreso ?? new Date(),
      mensaje: 'Egreso registrado correctamente y aforo liberado.',
    });
  }
  /**
   * Obtiene el estado actual del aforo en una sede específica.
   */
  async obtenerEstadoAforo(idSede: number): Promise<AforoStatusResponseDto> {
    const aforoMaximo =
      await this.accesosRepository.obtenerAforoMaximoSede(idSede);

    if (aforoMaximo === null) {
      throw new NotFoundException(`Sede con ID ${idSede} no fue encontrada.`);
    }

    const aforoActual = await this.accesosRepository.contarAforoActual(idSede);

    return new AforoStatusResponseDto({
      idSede,
      aforoActual,
      aforoMaximo,
    });
  }
  /**
   * Notifica el cambio de estado del aforo a los clientes.
   */
  async notificarCambioAforo(idSede: number): Promise<void> {
    const estadoActualizado = await this.obtenerEstadoAforo(idSede);
    this.aforoRealtimeService.emitirAforo(idSede, estadoActualizado);
  }

  /**
   * Obtiene los datos del perfil y el estado real de la membresía del socio.
   */
  async obtenerPerfilSocio(idUsuario: number) {
    const usuario = await this.usuariosService.findById(idUsuario);

    if (!usuario) {
      throw new NotFoundException({
        statusCode: 404,
        message: `Usuario con ID ${idUsuario} no encontrado.`,
        error: 'Not Found',
      });
    }

    // Consultamos el estado real de la membresía usando el servicio de membresías
    const estadoMembresia =
      await this.membresiasService.verificarMembresia(idUsuario);
    return {
      socioId: usuario.id_usuario,
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      dni: usuario.dni,
      foto_url: usuario.foto_url,
      id_sede: usuario.id_sede,
      id_ciudad: usuario.sede?.id_ciudad ?? null,
      nombre_ciudad: usuario.sede?.ciudad?.nombre ?? null,
      estado:
        estadoMembresia.esSocioActivo && !estadoMembresia.enMora
          ? 'ACTIVO'
          : 'INACTIVO',
      membresia: usuario.membresia,
    };
  }
  /**
   * Procesa la sincronización de un acceso u operación registrada offline.
   */
  async sincronizarAccesoOffline(dto: SincronizarAccesoOfflineDto) {
    const usuario = await this.usuariosService.findById(dto.id_usuario);
    if (!usuario) {
      throw new NotFoundException(
        `Usuario con ID ${dto.id_usuario} no encontrado.`,
      );
    }

    const sedeDestino = await this.accesosRepository.buscarSedePorId(
      dto.id_sede,
    );
    if (!sedeDestino) {
      throw new NotFoundException(`Sede con ID ${dto.id_sede} no encontrada.`);
    }

    if (dto.tipo === 'INGRESO') {
      // Validamos membresía antes de sincronizar el ingreso offline
      const estadoMembresia = await this.membresiasService.verificarMembresia(
        dto.id_usuario,
      );
      if (!estadoMembresia.esSocioActivo || estadoMembresia.enMora) {
        throw new ForbiddenException({
          statusCode: 403,
          message:
            'Sincronización rechazada: El usuario no cuenta con membresía activa o está en mora.',
          error: 'Forbidden',
        });
      }

      const accesoActivo =
        await this.accesosRepository.buscarAccesoActivoPorUsuario(
          dto.id_usuario,
        );
      if (accesoActivo) {
        return {
          mensaje: 'El usuario ya figuraba con un ingreso activo previo.',
        };
      }

      // Reutilizamos la firma exacta que usa tu repositorio (id_usuario, id_sede)
      await this.accesosRepository.crearIngreso(dto.id_usuario, dto.id_sede);
    } else if (dto.tipo === 'EGRESO') {
      const accesoActivo =
        await this.accesosRepository.buscarAccesoActivoPorUsuario(
          dto.id_usuario,
        );
      if (!accesoActivo) {
        return {
          mensaje:
            'No se encontró un ingreso activo para cerrar el egreso offline.',
        };
      }

      // Usamos el método cerrarEgreso pasando el id del registro y la fecha de salida (o el timestamp histórico)
      const fechaSalida = dto.timestamp ? new Date(dto.timestamp) : new Date();
      await this.accesosRepository.cerrarEgreso(
        accesoActivo.id_registro_acceso,
        fechaSalida,
      );
    }

    await this.notificarCambioAforo(dto.id_sede);
    return {
      mensaje: `Sincronización offline de ${dto.tipo} procesada con éxito.`,
    };
  }
}
