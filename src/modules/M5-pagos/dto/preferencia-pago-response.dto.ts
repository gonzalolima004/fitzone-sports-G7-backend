import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PreferenciaPagoResponseDto {
  @ApiProperty({
    description:
      'Identificador único de la preferencia generada en Mercado Pago',
    example: '111111111-abcdef12-3456-7890-abcd-ef1234567890',
  })
  preferenceId: string;

  @ApiProperty({
    description:
      'URL oficial de redirección para completar el pago en Mercado Pago Checkout Pro (Producción)',
    example:
      'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=111111111-abcdef12-3456-7890-abcd-ef1234567890',
  })
  initPoint: string;

  @ApiProperty({
    description:
      'URL de pruebas para Checkout Pro en el entorno Sandbox de Mercado Pago',
    example:
      'https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=111111111-abcdef12-3456-7890-abcd-ef1234567890',
  })
  sandboxInitPoint: string;

  @ApiPropertyOptional({
    description:
      'Identificador del registro de intención de pago generado en FitZone',
    example: 1,
  })
  id_pago?: number;
}
