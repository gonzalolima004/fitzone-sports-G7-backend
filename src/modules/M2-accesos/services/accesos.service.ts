import {
  Injectable,
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

export interface PayloadQrToken {
  id_usuario: number;
  iat: number;
}

@Injectable()
export class AccesosService {
  constructor(
    private readonly accesosRepository: AccesosRepository,
    private readonly qrService: QrService,
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
}
