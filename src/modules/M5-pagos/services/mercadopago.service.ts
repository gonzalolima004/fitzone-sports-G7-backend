import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { MercadoPagoConfigOptions } from '../../../config/mercadopago.config';

import type { PaymentResponse } from 'mercadopago/dist/clients/payment/commonTypes';

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

  /**
   * Consulta el estado oficial de una transacción directamente en los servidores
   * de Mercado Pago (Payment.get) para certificar su estado real (approved, rejected, pending, etc.)
   * y prevenir falsificaciones en webhooks (RF-13).
   */
  async consultarPago(id: string | number): Promise<PaymentResponse> {
    try {
      this.logger.log(`Consultando estado del pago #${id} en Mercado Pago...`);
      const payment = await this.payment.get({ id: String(id) });
      this.logger.log(
        `Pago #${id} verificado en Mercado Pago. Estado: '${payment.status}' (detalle: '${payment.status_detail}').`,
      );
      return payment;
    } catch (error: unknown) {
      this.logger.error(
        `Error al consultar el pago #${id} en los servidores de Mercado Pago:`,
        error,
      );
      throw error;
    }
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
