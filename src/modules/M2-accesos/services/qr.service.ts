import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';

import { QrDinamicoResponseDto } from '../dto/qr-dinamico-response.dto';

@Injectable()
export class QrService {
  private readonly logger = new Logger(QrService.name);
  private readonly jwtSecret: string;
  private readonly EXPIRATION_SECONDS = 60;

  constructor(private readonly configService: ConfigService) {
    this.jwtSecret = this.configService.getOrThrow<string>('QR_TOKEN_SECRET');
  }

  /**
   * Genera una firma para el token QR.
   *
   * @param idUsuario - ID del usuario.
   * @param expTimestamp - Timestamp de expiración.
   * @returns Firma generada.
   */
  private generarFirma(idUsuario: string, expTimestamp: number): string {
    return createHmac('sha256', this.jwtSecret)
      .update(`${idUsuario}:${expTimestamp}`)
      .digest('hex')
      .substring(0, 16); // 16 caracteres de firma son más que suficientes para QR de acceso rápido
  }
  /**
   * Genera un token QR dinámico para un usuario.
   *
   * @param idUsuario - ID del usuario al que pertenece el token.
   * @returns Objeto con el token QR y su información de expiración.
   * @throws `InternalServerErrorException` si ocurre un error al generar el token.
   */
  generarQrDinamico(idUsuario: number | string): QrDinamicoResponseDto {
    try {
      const numericUserId = Number(idUsuario);
      const fechaGeneracion = new Date();
      // Guardamos el timestamp EXACTO de creación (emisión) en segundos
      const timestampCreacion = Math.floor(fechaGeneracion.getTime() / 1000);

      const signature = this.generarFirma(
        String(numericUserId),
        timestampCreacion,
      );

      const token = `${numericUserId}.${timestampCreacion}.${signature}`;

      return new QrDinamicoResponseDto({
        token,
        expiraEnSegundos: this.EXPIRATION_SECONDS,
        fechaGeneracion,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error indeterminado';
      this.logger.error(`Error en generarQrDinamico: ${errorMessage}`);

      throw new InternalServerErrorException(
        'Error al generar el código QR dinámico',
      );
    }
  }
  /**
   * Valida que el token QR sea válido y no haya expirado.
   *
   * @param token - Token QR a validar.
   * @param idUsuario - ID del usuario al que pertenece el token.
   * @returns `true` si el token es válido, `false` en caso contrario.
   * @throws `BadRequestException` si el token es inválido o ha expirado.
   */
  validarTokenEfimero(token: string, idUsuario: number | string): boolean {
    try {
      const partes = token.split('.');
      if (partes.length !== 3) {
        throw new BadRequestException('Formato de token inválido');
      }

      const [userIdToken, timestampStr, signatureToken] = partes;
      const tokenTimestamp = parseInt(timestampStr, 10);
      const currentTimestamp = Math.floor(Date.now() / 1000);

      if (userIdToken !== String(idUsuario)) {
        throw new BadRequestException('Token no válido para este usuario');
      }

      // Calculamos cuánto tiempo ha pasado desde que se creó el token
      const segundosTranscurridos = currentTimestamp - tokenTimestamp;

      // Si el token es del futuro (error de reloj) o pasaron más de 60 segundos
      if (
        isNaN(tokenTimestamp) ||
        segundosTranscurridos < 0 ||
        segundosTranscurridos > this.EXPIRATION_SECONDS
      ) {
        throw new BadRequestException('El código QR ha expirado');
      }

      // Reconstruimos la firma usando el mismo timestamp de creación que viajó en el token
      const signatureEsperada = this.generarFirma(userIdToken, tokenTimestamp);

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
