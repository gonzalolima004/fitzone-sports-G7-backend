import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO que modela la respuesta HTTP entregada a Mercado Pago tras la recepción de un Webhook.
 * Debe devolverse con HTTP 200 OK para confirmar recepción y evitar reintentos automáticos.
 */
export class WebhookResponseDto {
  @ApiProperty({
    description:
      'Indica si la notificación fue recibida y aceptada correctamente',
    example: true,
  })
  received: boolean;

  @ApiProperty({
    description:
      'Estado del procesamiento del evento (ej. processed, ignored, error)',
    example: 'processed',
  })
  status: string;

  @ApiPropertyOptional({
    description:
      'Mensaje descriptivo opcional sobre el resultado del procesamiento',
    example: 'Notificación de pago procesada exitosamente',
  })
  message?: string;
}
