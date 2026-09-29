import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { createHmac } from 'crypto';
import { generate, verify } from 'otplib';
import { UserRepository } from '../repositories/user.repository';
import { QrDinamicoResponseDto } from '../dto/qr-dinamico-response.dto';
import { IQrTokenPayload } from '../../../common/interfaces/qr-payload.interface';

@Injectable()
export class QrService {
  private readonly logger = new Logger(QrService.name);
  private readonly jwtSecret: string;
  private readonly EXPIRATION_SECONDS = 60;
  private readonly TOTP_TOLERANCE_SECONDS = 5;

  constructor(
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
  ) {
    this.jwtSecret = this.configService.getOrThrow<string>('QR_TOKEN_SECRET');
  }

  /**
   * Genera un secreto TOTP determinista para cada usuario.
   */
  private obtenerSecretTOTP(idUsuario: number | string): Buffer {
    return createHmac('sha256', this.jwtSecret)
      .update(`qr-acceso:${idUsuario}`)
      .digest();
  }

  /**
   * Genera el QR dinámico del usuario.
   */
  async generarQrDinamico(
    idUsuario: number | string,
  ): Promise<QrDinamicoResponseDto> {
    try {
      const numericUserId = Number(idUsuario);
      const fechaGeneracion = new Date();
      const userSecret = this.obtenerSecretTOTP(numericUserId);

      const totpCode: string = await generate({
        secret: userSecret,
        period: this.EXPIRATION_SECONDS,
      });

      const payload: IQrTokenPayload = {
        sub: String(numericUserId),
        type: 'qr_acceso',
        totp: totpCode,
      };

      const token: string = jwt.sign(payload, this.jwtSecret, {
        algorithm: 'HS256',
        expiresIn: this.EXPIRATION_SECONDS,
      });

      const baseUrl: string = this.configService.get<string>(
        'APP_URL',
        'http://localhost:3000',
      );
      const qrUrl = `${baseUrl}/access/qr/verify?token=${token}`;

      // Actualización en repositorio opcional según necesidades de arquitectura apátrida
      await this.userRepository.actualizarQrUrl(numericUserId, qrUrl);

      const timestampActual = Math.floor(Date.now() / 1000);
      const segundosRestantes =
        this.EXPIRATION_SECONDS - (timestampActual % this.EXPIRATION_SECONDS);

      return new QrDinamicoResponseDto({
        token,
        expiraEnSegundos: segundosRestantes,
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
   * Valida un QR dinámico comprobando firma, expiración y algoritmo.
   */
  async validarTokenEfimero(
    token: string,
    idUsuario: number | string,
  ): Promise<boolean> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        algorithms: ['HS256'],
      }) as IQrTokenPayload;

      if (decoded.sub !== String(idUsuario)) {
        throw new UnauthorizedException('Token no válido para este usuario');
      }

      if (decoded.type !== 'qr_acceso') {
        throw new UnauthorizedException('Tipo de token inválido');
      }

      const userSecret = this.obtenerSecretTOTP(idUsuario);

      const resultado = await verify({
        secret: userSecret,
        token: decoded.totp,
        period: this.EXPIRATION_SECONDS,
        epochTolerance: [this.TOTP_TOLERANCE_SECONDS, 0],
      });

      if (!resultado.valid) {
        throw new UnauthorizedException(
          'El código QR ha expirado o es inválido',
        );
      }

      return true;
    } catch (error: unknown) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('El código QR ha expirado');
      }

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      const message =
        error instanceof Error ? error.message : 'Error de verificación';
      this.logger.warn(`Intento fallido de validación de QR: ${message}`);

      throw new UnauthorizedException('Token de acceso inválido');
    }
  }
}
