import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { MembresiasService } from '../../M1-usuarios/services/membresias.service';
import { UsuariosService } from '../../M1-usuarios/services/usuarios.service';
import { QrDinamicoResponseDto } from '../dto/qr-dinamico-response.dto';

@Injectable()
export class QrService {
  private readonly logger = new Logger(QrService.name);
  private readonly jwtSecret: string;
  private readonly EXPIRATION_SECONDS = 60;

  constructor(
    private readonly configService: ConfigService,
    private readonly membresiasService: MembresiasService,
    private readonly usuariosService: UsuariosService,
  ) {
    this.jwtSecret = this.configService.getOrThrow<string>('QR_TOKEN_SECRET');
  }

  private generarFirma(
    idUsuario: string,
    idCiudad: number,
    expTimestamp: number,
  ): string {
    return createHmac('sha256', this.jwtSecret)
      .update(`${idUsuario}:${idCiudad}:${expTimestamp}`)
      .digest('hex')
      .substring(0, 16);
  }

  async generarQrDinamico(
    idUsuario: number | string,
  ): Promise<QrDinamicoResponseDto> {
    try {
      const numericUserId = Number(idUsuario);
      const estadoMembresia =
        await this.membresiasService.verificarMembresia(numericUserId);

      if (!estadoMembresia.esSocioActivo || estadoMembresia.enMora) {
        throw new ForbiddenException({
          statusCode: 403,
          message:
            'No se puede generar el código QR: El usuario no cuenta con una membresía activa o se encuentra en mora.',
          error: 'Forbidden',
        });
      }

      const usuario = await this.usuariosService.findById(numericUserId);
      const idCiudad = usuario?.sede?.id_ciudad;
      if (!idCiudad) {
        throw new BadRequestException({
          statusCode: 400,
          message:
            'No se puede generar el código QR: El usuario no tiene asignada una ciudad válida.',
          error: 'Bad Request',
        });
      }

      const fechaGeneracion = new Date();
      const timestampCreacion = Math.floor(fechaGeneracion.getTime() / 1000);

      const signature = this.generarFirma(
        String(numericUserId),
        idCiudad,
        timestampCreacion,
      );

      // Estructura exacta de 4 partes: idUsuario.idCiudad.timestamp.signature
      const token = `${numericUserId}.${idCiudad}.${timestampCreacion}.${signature}`;

      return new QrDinamicoResponseDto({
        token,
        expiraEnSegundos: this.EXPIRATION_SECONDS,
        fechaGeneracion,
      });
    } catch (error: unknown) {
      if (
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Error indeterminado';
      this.logger.error(`Error en generarQrDinamico: ${errorMessage}`);

      throw new InternalServerErrorException(
        'Error al generar el código QR dinámico',
      );
    }
  }

  validarTokenEfimero(token: string, idUsuario: number | string): boolean {
    try {
      const partes = token.split('.');
      if (partes.length !== 4) {
        throw new BadRequestException('Formato de token inválido');
      }

      const [userIdToken, idCiudadTokenStr, timestampStr, signatureToken] =
        partes;
      const tokenTimestamp = parseInt(timestampStr, 10);
      const currentTimestamp = Math.floor(Date.now() / 1000);

      if (userIdToken !== String(idUsuario)) {
        throw new BadRequestException('Token no válido para este usuario');
      }

      const segundosTranscurridos = currentTimestamp - tokenTimestamp;

      if (
        isNaN(tokenTimestamp) ||
        segundosTranscurridos < 0 ||
        segundosTranscurridos > this.EXPIRATION_SECONDS
      ) {
        throw new BadRequestException('El código QR ha expirado');
      }

      const idCiudad = Number(idCiudadTokenStr);
      if (isNaN(idCiudad)) {
        throw new BadRequestException('Ciudad inválida en el token QR');
      }

      const signatureEsperada = this.generarFirma(
        userIdToken,
        idCiudad,
        tokenTimestamp,
      );

      const validSignature = timingSafeEqual(
        Buffer.from(signatureToken),
        Buffer.from(signatureEsperada),
      );

      if (!validSignature) {
        throw new BadRequestException('Código QR inválido o alterado');
      }

      return true;
    } catch (error: unknown) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      const message =
        error instanceof Error ? error.message : 'Error de verificación';
      this.logger.warn(`Intento fallido de validación de QR: ${message}`);

      throw new BadRequestException('Token de acceso inválido');
    }
  }
}
