import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Objeto de datos anidado en el payload del Webhook de Mercado Pago.
 * Contiene el identificador del recurso asociado (generalmente el payment id).
 */
export class MercadoPagoWebhookDataDto {
  @ApiProperty({
    description: 'Identificador del recurso en los servidores de Mercado Pago',
    example: '12345678901',
  })
  @IsString()
  @IsNotEmpty()
  id: string;
}

/**
 * DTO que modela el payload enviado por los Webhooks e IPN de Mercado Pago (RF-13).
 * Captura la estructura oficial: action, type, date_created, live_mode y data.id.
 */
export class MercadoPagoWebhookDto {
  @ApiPropertyOptional({
    description:
      'Acción que detonó la notificación (ej. payment.created, payment.updated)',
    example: 'payment.updated',
  })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({
    description: 'Versión de la API de Mercado Pago del webhook',
    example: 'v1',
  })
  @IsOptional()
  @IsString()
  api_version?: string;

  @ApiPropertyOptional({
    description: 'Contenedor con el identificador del recurso afectado',
    type: () => MercadoPagoWebhookDataDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MercadoPagoWebhookDataDto)
  data?: MercadoPagoWebhookDataDto;

  @ApiPropertyOptional({
    description:
      'Fecha y hora de generación de la notificación (formato ISO 8601)',
    example: '2026-09-24T12:00:00Z',
  })
  @IsOptional()
  @IsString()
  date_created?: string;

  @ApiPropertyOptional({
    description:
      'Identificador del evento o recurso provisto en la raíz del payload',
    example: '12345678901',
  })
  @IsOptional()
  id?: string | number;

  @ApiPropertyOptional({
    description:
      'Indica si la notificación corresponde al entorno productivo (true) o sandbox (false)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  live_mode?: boolean;

  @ApiPropertyOptional({
    description: 'Tipo de evento notificado (ej. payment, plan, subscription)',
    example: 'payment',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description:
      'Tópico de la notificación IPN de Mercado Pago (compatibilidad con notificaciones clásicas)',
    example: 'payment',
  })
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional({
    description:
      'Identificador del usuario / cuenta de Mercado Pago asociada a la integración',
    example: '123456789',
  })
  @IsOptional()
  user_id?: string | number;
}
