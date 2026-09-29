import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export type TipoConceptoPago = 'cancha' | 'membresia' | 'general';

/**
 * Estructura de desglose del concepto o servicio abonado
 */
export class PagoConceptoDto {
  @ApiProperty({
    description: 'Tipo de servicio o entidad abonada',
    enum: ['cancha', 'membresia', 'general'],
    example: 'cancha',
  })
  @IsEnum(['cancha', 'membresia', 'general'])
  tipo: TipoConceptoPago;

  @ApiPropertyOptional({
    description:
      'Identificador único del recurso referenciado (id_cancha_reserva o id_membresia)',
    example: 4,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  id_referencia: number | null;

  @ApiProperty({
    description: 'Denominación sintética del servicio abonado',
    example: 'Reserva Cancha Pádel 1',
  })
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @ApiProperty({
    description:
      'Detalle contextual ampliado (ej. sede, horario de reserva o período de vigencia de membresía)',
    example: 'Sede Central - Horario: 26/09/2026 18:00 a 19:00 hs',
  })
  @IsString()
  @IsNotEmpty()
  detalle: string;
}

/**
 * DTO de respuesta para el detalle y trazabilidad de un pago realizado
 */
export class PagoDetalleResponseDto {
  @ApiProperty({
    description: 'Identificador único numérico del registro de pago',
    example: 101,
  })
  @IsInt()
  id_pago: number;

  @ApiProperty({
    description: 'Monto total abonado en Pesos Argentinos (ARS)',
    example: 15000.0,
  })
  @IsNumber()
  monto: number;

  @ApiProperty({
    description: 'Fecha y hora en que se registró el pago en la plataforma',
    example: '2026-09-26T14:30:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  fecha_pago: Date;

  @ApiProperty({
    description:
      'Estado actual del pago en el sistema (Pendiente, Aprobado, Rechazado)',
    example: 'Aprobado',
  })
  @IsString()
  estado: string;

  @ApiPropertyOptional({
    description:
      'Identificador o token de transacción certificado por Mercado Pago',
    example: '1234567890',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  token_transaccion?: string | null;

  @ApiPropertyOptional({
    description:
      'Ruta relativa del endpoint para visualización e impresión directa del comprobante PDF (RF-14)',
    example: '/pagos/101/comprobante',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  comprobante_url?: string | null;

  @ApiProperty({
    description: 'Detalle del concepto o servicio deportivo asociado al pago',
    type: PagoConceptoDto,
  })
  @ValidateNested()
  @Type(() => PagoConceptoDto)
  concepto: PagoConceptoDto;
}
