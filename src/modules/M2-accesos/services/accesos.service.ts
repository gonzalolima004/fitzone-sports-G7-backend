import {
  Injectable,
  NotFoundException,
  BadRequestException,
  //ForbiddenException,
  //UnauthorizedException,
  //ConflictException,
} from '@nestjs/common';
//import { RegistroAcceso } from '@prisma/client';
import { AccesosRepository } from '../repositories/accesos.repository';
import { QrService } from './qr.service';
//import { MembresiasService } from '../../M1-usuarios/services/membresias.service';
//import { ValidarIngresoDto } from '../dto/validar-ingreso.dto';
//import { AccesoResponseDto } from '../dto/acceso-response.dto';
import { RegistrarEgresoDto } from '../dto/registrar-egreso.dto';
import { EgresoResponseDto } from '../dto/egreso-response.dto';
import { AforoRealtimeService } from './aforo-realtime.service';
import { AforoStatusResponseDto } from '../dto/aforo-status-response.dto';

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
    //private readonly membresiasService: MembresiasService,
  ) {}

  /*

  async validarYRegistrarIngreso(dto: ValidarIngresoDto): Promise<AccesoResponseDto> {
     1. Decodificar y validar vigencia/firma del token QR (< 60s)
    let payload: PayloadQrToken;
    try {
      payload = await this.qrService.validarTokenEfimero(dto.qrToken);
    } catch {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'El código QR es inválido o ha expirado (vigencia máxima 60 segundos).',
        error: 'Unauthorized',
      });
    }

    const { id_usuario } = payload;

     2. Corroborar el estado de la membresía y regla de mora (RN-03 / RF-03)
    const estadoMembresia = await this.membresiasService.verificarEstadoMembresia(id_usuario);
    if (!estadoMembresia.esSocioActivo || estadoMembresia.enMora) {
      throw new ForbiddenException({
        statusCode: 403,
        message: 'Acceso rechazado: El usuario no cuenta con una membresía activa o se encuentra en mora.',
        error: 'Forbidden',
      });
    }

     3. Transacción atómica para prevenir race conditions y aplicar regla Anti-Doble Ingreso (RN-01)
    const nuevoRegistro: RegistroAcceso = await this.accesosRepository.ejecutarTransaccionIngreso(
      async (tx) => {
    const accesoActivo = await this.accesosRepository.buscarAccesoActivoPorUsuario(id_usuario);

    if (accesoActivo) {
          throw new ConflictException({
            statusCode: 409,
            message: `Acceso rechazado (RN-01): El usuario ya figura dentro de la sede '${accesoActivo.sede.nombre}' sin haber registrado su egreso.`,
            error: 'Conflict',
          });
        }

        return this.accesosRepository.crearIngreso(id_usuario, dto.id_sede, tx);
      },
    );

    return new AccesoResponseDto({
      id_registro_acceso: nuevoRegistro.id_registro_acceso,
      nombreUsuario: estadoMembresia.nombreUsuario,
      accesoPermitido: true,
      fechaIngreso: nuevoRegistro.fecha_ingreso,
      mensaje: 'Acceso autorizado correctamente.',
    });
  }
  */

  /**
   * Procesa el egreso de un socio, verifica que tenga un acceso activo en la sede especificada
   * y calcula los minutos de permanencia en el establecimiento.
   */
  async registrarEgreso(dto: RegistrarEgresoDto): Promise<EgresoResponseDto> {
    const accesoActivo =
      await this.accesosRepository.buscarAccesoActivoPorUsuario(dto.id_usuario);

    if (!accesoActivo) {
      throw new NotFoundException({
        statusCode: 404,
        message: `No se encontró una entrada activa para el usuario con ID ${dto.id_usuario}.`,
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

    /* 
        const minutosPermanencia = this.calcularMinutosPermanencia(
          registroCerrado.fecha_ingreso,
          registroCerrado.fecha_egreso ?? fechaSalida,
        );*/

    return new EgresoResponseDto({
      id_registro_acceso: registroCerrado.id_registro_acceso,
      id_usuario: registroCerrado.id_usuario,
      id_sede: registroCerrado.id_sede,
      fechaIngreso: registroCerrado.fecha_ingreso,
      fechaEgreso: registroCerrado.fecha_egreso ?? new Date(),
      mensaje: 'Egreso registrado correctamente y aforo liberado.',
    });
  }
  /*
    /**
   * Función para calcular los minutos transcurridos entre el ingreso y el egreso.
   *
    private calcularMinutosPermanencia(
      fechaIngreso: Date,
      fechaEgreso: Date,
    ): number {
      const ingresoMs = fechaIngreso.getTime();
      const egresoMs = fechaEgreso.getTime();
  
      const diferenciaMs = Math.max(0, egresoMs - ingresoMs);
      return Math.round(diferenciaMs / (1000 * 60));
    }
    */
  async obtenerEstadoAforo(idSede: number): Promise<AforoStatusResponseDto> {
    const aforoMaximo =
      await this.accesosRepository.obtenerAforoMaximoSede(idSede);

    if (aforoMaximo === null) {
      throw new NotFoundException(`Sede con ID ${idSede} no fue encontrada.`);
    }

    const aforoActual = await this.accesosRepository.contarAforoActual(idSede);
    //const porcentajeCalculado = (aforoActual / aforoMaximo) * 100;
    //const porcentajeOcupacion = Number(porcentajeCalculado.toFixed(2));
    //const aforoExcedido = aforoActual > aforoMaximo;

    return new AforoStatusResponseDto({
      idSede,
      aforoActual,
      aforoMaximo,
    });
  }

  async notificarCambioAforo(idSede: number): Promise<void> {
    const estadoActualizado = await this.obtenerEstadoAforo(idSede);
    await this.aforoRealtimeService.emitirAforo(idSede, estadoActualizado);
  }
}
