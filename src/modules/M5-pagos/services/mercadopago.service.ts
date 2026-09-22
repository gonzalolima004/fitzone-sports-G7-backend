import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { MercadoPagoConfigOptions } from '../../../config/mercadopago.config';

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private client: MercadoPagoConfig;
  public preference: Preference;
  public payment: Payment;

  constructor(private readonly configService: ConfigService) {
    const mpConfig =
      this.configService.get<MercadoPagoConfigOptions>('mercadopago');
    const accessToken =
      mpConfig?.accessToken || process.env.MERCADOPAGO_ACCESS_TOKEN || '';

    if (!accessToken) {
      this.logger.warn(
        'MERCADOPAGO_ACCESS_TOKEN no está configurado. Las operaciones con Mercado Pago podrían fallar.',
      );
    }

    this.client = new MercadoPagoConfig({
      accessToken,
      options: {
        timeout: 5000,
      },
    });

    this.preference = new Preference(this.client);
    this.payment = new Payment(this.client);
    this.logger.log('MercadoPagoService inicializado correctamente.');
  }

  get config(): MercadoPagoConfigOptions {
    return (
      this.configService.get<MercadoPagoConfigOptions>('mercadopago') || {
        accessToken: '',
        publicKey: '',
        webhookSecret: '',
        backUrls: {
          success: '',
          failure: '',
          pending: '',
        },
        notificationUrl: '',
      }
    );
  }

  get backUrls() {
    return this.config.backUrls;
  }

  get notificationUrl(): string {
    return this.config.notificationUrl;
  }

  get publicKey(): string {
    return this.config.publicKey;
  }

  get webhookSecret(): string {
    return this.config.webhookSecret;
  }
}
