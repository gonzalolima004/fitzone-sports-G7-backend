import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { createHmac } from 'crypto';
import { generate, verify } from 'otplib';
import { UserRepository } from '../repositories/user.repository';
import { QrDinamicoResponseDto } from '../dto/qr-dinamico-response.dto';

@Injectable()
export class QrService {
  private readonly jwtSecret: string;

  /**
   * El QR cambia cada 60 segundos.
   */
  private readonly EXPIRATION_SECONDS = 60;

  /**
   * Tolerancia para pequeñas diferencias entre relojes.
   * No aceptamos códigos futuros.
   */
  private readonly TOTP_TOLERANCE_SECONDS = 5;

  constructor(
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
  ) {
    /**
     * Usamos una clave específica para los QR.
     *
     * NO usamos S3_SECRET_ACCESS_KEY.
     * NO usamos un fallback inseguro.
     */
    this.jwtSecret = this.configService.getOrThrow<string>('QR_TOKEN_SECRET');
  }

  /**
   * Genera un secreto TOTP determinista para cada usuario.
   *
   * La misma combinación:
   *
   * QR_TOKEN_SECRET + idUsuario
   *
   * siempre genera el mismo secreto.
   *
   * Pero cada usuario tiene un secreto diferente.
   */
  private obtenerSecretTOTP(idUsuario: number | string): Buffer {
    return createHmac('sha256', this.jwtSecret)
      .update(`qr-acceso:${idUsuario}`)
      .digest();
  }

  /**
   * Genera el QR dinámico del socio.
   *
   * El código TOTP cambia cada 60 segundos.
   */
  async generarQrDinamico(
    idUsuario: number | string,
  ): Promise<QrDinamicoResponseDto> {
    try {
      const fechaGeneracion = new Date();

      const userSecret = this.obtenerSecretTOTP(idUsuario);

      /**
       * Generamos el código temporal.
       */
      const totpCode = await generate({
        secret: userSecret,
        period: this.EXPIRATION_SECONDS,
      });

      const payload = {
        sub: String(idUsuario),
        type: 'qr_acceso',
        totp: totpCode,
      };

      const token = jwt.sign(payload, this.jwtSecret, {
        algorithm: 'HS256',
        expiresIn: this.EXPIRATION_SECONDS,
      });

      const baseUrl = this.configService.get<string>(
        'APP_URL',
        'http://localhost:3000',
      );
      const qrUrl = `${baseUrl}/access/qr/verify?token=${token}`;

      await this.userRepository.actualizarQrUrl(idUsuario, qrUrl);

      const timestampActual = Math.floor(Date.now() / 1000);

      const segundosRestantes =
        this.EXPIRATION_SECONDS - (timestampActual % this.EXPIRATION_SECONDS);

      return new QrDinamicoResponseDto({
        token,
        expiraEnSegundos: segundosRestantes,
        fechaGeneracion,
      });
    } catch (error) {
      // Imprimimos PRIMERO el error en consola para depurar
      console.error('❌ Error detallado en QrService:', error);

      throw new InternalServerErrorException(
        'Error al generar el código QR dinámico',
      );
    }
  }

  /**
   * Valida un QR dinámico.
   *
   * Comprueba:
   *
   * 1. Firma del JWT.
   * 2. Algoritmo utilizado.
   * 3. Expiración del JWT.
   * 4. Usuario correspondiente.
   * 5. Tipo de token.
   * 6. Código TOTP.
   */
  async validarTokenEfimero(
    token: string,
    idUsuario: number | string,
  ): Promise<boolean> {
    try {
      /**
       * 1. Validamos firma y expiración del JWT.
       */
      const decoded = jwt.verify(token, this.jwtSecret, {
        algorithms: ['HS256'],
      }) as {
        sub: string;
        type: string;
        totp: string;
        iat: number;
        exp: number;
      };

      /**
       * 2. Verificamos que el token pertenezca
       * al usuario que está intentando ingresar.
       */
      if (decoded.sub !== String(idUsuario)) {
        throw new UnauthorizedException('Token no válido para este usuario');
      }

      /**
       * 3. Verificamos que sea un QR de acceso.
       */
      if (decoded.type !== 'qr_acceso') {
        throw new UnauthorizedException('Tipo de token inválido');
      }

      /**
       * 4. Obtenemos el mismo secreto TOTP
       * que utilizamos al generar el QR.
       */
      const userSecret = this.obtenerSecretTOTP(idUsuario);

      /**
       * 5. Validamos el código TOTP.
       *
       * period = 60:
       * el código cambia cada minuto.
       *
       * epochTolerance = [5, 0]:
       * permitimos hasta 5 segundos de diferencia
       * hacia atrás, pero no aceptamos códigos futuros.
       */
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
    } catch (error) {
      /**
       * JWT expirado.
       */
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('El código QR ha expirado');
      }

      /**
       * Errores que nosotros mismos generamos.
       */
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      /**
       * Cualquier otro problema de validación.
       */
      throw new UnauthorizedException('Token de acceso inválido');
    }
  }
}
