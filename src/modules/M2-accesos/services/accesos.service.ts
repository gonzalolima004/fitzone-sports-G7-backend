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

export interface PayloadQrToken {
  id_usuario: number;
  iat: number;
}

@Injectable()
export class AccesosService {
  constructor(
    private readonly accesosRepository: AccesosRepository,
    private readonly qrService: QrService,
    private readonly aforoRealtimeService: AforoRealtimeService,
    private readonly membresiasService: MembresiasService,
    private readonly usuariosService: UsuariosService,
  ) {}

  /**
   * Método auxiliar privado para extraer y validar el ID de usuario desde el token QR.
   */
  private extraerIdDeToken(qrToken: string): number {
    const partes = qrToken.split('.');
    if (partes.length !== 3) {
      throw new BadRequestException('Formato de token QR inválido.');
    }
    const id_usuario = Number(partes[0]);
    if (isNaN(id_usuario) || id_usuario <= 0) {
      throw new BadRequestException('ID de usuario inválido en el token QR.');
    }
    return id_usuario;
  }
  /**
   * Método auxiliar privado para resolver el id_usuario ya sea por QR o por DNI.
   */
  private async resolverIdUsuario(dto: {
    qrToken?: string;
    dni?: string;
  }): Promise<number> {
    // Si viene un DNI, buscamos el usuario directamente en la base de datos
    if (dto.dni) {
      const usuario = await this.accesosRepository.buscarUsuarioPorDni(dto.dni);
      if (!usuario) {
        throw new NotFoundException({
          statusCode: 404,
          message: `No se encontró ningún usuario registrado con el DNI ${dto.dni}.`,
          error: 'Not Found',
        });
      }
      return usuario.id_usuario;
    }

    // Si viene un token QR, procedemos con la validación efímera
    if (dto.qrToken) {
      const id_usuario = this.extraerIdDeToken(dto.qrToken);
      try {
        this.qrService.validarTokenEfimero(dto.qrToken, id_usuario);
      } catch {
        throw new BadRequestException({
          statusCode: 400,
          message: 'El código QR es inválido o ha expirado.',
          error: 'Bad Request',
        });
      }
      return id_usuario;
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
          await this.accesosRepository.buscarAccesoActivoPorUsuario(id_usuario);

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
}
