import { registerAs } from '@nestjs/config';

export interface MercadoPagoConfigOptions {
  accessToken: string;
  publicKey: string;
  webhookSecret: string;
  backUrls: {
    success: string;
    failure: string;
    pending: string;
  };
  notificationUrl: string;
}

export const mercadopagoConfig = registerAs(
  'mercadopago',
  (): MercadoPagoConfigOptions => ({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
    publicKey: process.env.MERCADOPAGO_PUBLIC_KEY || '',
    webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET || '',
    backUrls: {
      success: process.env.BACK_URL_SUCCESS || '',
      failure: process.env.BACK_URL_FAILURE || '',
      pending: process.env.BACK_URL_PENDING || '',
    },
    notificationUrl: process.env.NOTIFICATION_URL || '',
  }),
);

export default mercadopagoConfig;
