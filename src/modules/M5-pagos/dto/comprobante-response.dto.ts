import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

/**
 * Parámetros de ruta para la consulta del comprobante
 */
export class ComprobanteParamsDto {
  @ApiProperty({
    description:
      'Identificador único numérico del pago a consultar comprobante',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  id: number;
}

/**
 * Datos del emisor o institución deportiva
 */
export class ComprobanteEmisorDto {
  @ApiProperty({
    description: 'Nombre de la entidad o club emisor',
    example: 'FitZone Sports Club',
  })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({
    description: 'Subtítulo del comprobante o rubro de la empresa',
    example: 'Comprobante de Pago Electrónico (RF-14)',
  })
  @IsString()
  @IsNotEmpty()
  subtitulo: string;

  @ApiProperty({
    description: 'Descripción complementaria o eslogan de la empresa',
    example: 'Gestión integral de canchas, socios y membresías',
  })
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @ApiPropertyOptional({
    description: 'Email o datos de contacto de soporte del emisor',
    example: 'soporte@fitzone.com',
  })
  @IsOptional()
  @IsString()
  contacto?: string;
}

/**
 * Datos del cliente / pagador en el comprobante
 */
export class ComprobanteClienteDto {
  @ApiProperty({
    description: 'Nombre del cliente o socio pagador',
    example: 'Juan',
  })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({
    description: 'Apellido del cliente o socio pagador',
    example: 'Pérez',
  })
  @IsString()
  @IsNotEmpty()
  apellido: string;

  @ApiProperty({
    description: 'Documento Nacional de Identidad del cliente',
    example: '38123456',
  })
  @IsString()
  @IsNotEmpty()
  dni: string;

  @ApiProperty({
    description: 'Correo electrónico del cliente',
    example: 'juan.perez@fitzone.com',
  })
  @IsEmail()
  email: string;
}

/**
 * Detalle del ítem facturado en el comprobante
 */
export class ComprobanteItemDto {
  @ApiProperty({
    description: 'Concepto principal del ítem facturado',
    example: 'Reserva Cancha Pádel 1',
  })
  @IsString()
  @IsNotEmpty()
  concepto: string;

  @ApiProperty({
    description:
      'Detalle o descripción complementaria (ej: sede, horario, duración de membresía)',
    example: 'Sede Central - Horario: 24/09/2026 18:00 a 19:30 hs',
  })
  @IsString()
  detalle: string;

  @ApiProperty({
    description: 'Cantidad de unidades adquiridas',
    example: 1,
    default: 1,
  })
  @IsNumber()
  cantidad: number;

  @ApiProperty({
    description: 'Precio unitario en Pesos Argentinos (ARS)',
    example: 15000.0,
  })
  @IsNumber()
  precio_unitario: number;

  @ApiProperty({
    description: 'Subtotal del ítem en Pesos Argentinos (ARS)',
    example: 15000.0,
  })
  @IsNumber()
  subtotal: number;
}

/**
 * Estructura completa de respuesta con todos los datos dinámicos del comprobante de pago
 */
export class ComprobanteResponseDto {
  @ApiProperty({
    description: 'Identificador único del pago en la base de datos',
    example: 1,
  })
  @IsInt()
  id_pago: number;

  @ApiProperty({
    description: 'Número oficial de ticket o factura formateado para impresión',
    example: 'FZ-PAGO-00000001',
  })
  @IsString()
  nro_ticket: string;

  @ApiProperty({
    description: 'Fecha y hora de emisión del comprobante',
    example: '2026-09-24T18:00:00.000Z',
  })
  fecha_emision: Date;

  @ApiProperty({
    description: 'Información institucional del emisor del comprobante',
    type: ComprobanteEmisorDto,
  })
  @ValidateNested()
  @Type(() => ComprobanteEmisorDto)
  emisor: ComprobanteEmisorDto;

  @ApiProperty({
    description: 'Información del cliente o socio titular',
    type: ComprobanteClienteDto,
  })
  @ValidateNested()
  @Type(() => ComprobanteClienteDto)
  cliente: ComprobanteClienteDto;

  @ApiProperty({
    description: 'Desglose de conceptos e ítems abonados',
    type: [ComprobanteItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComprobanteItemDto)
  items: ComprobanteItemDto[];

  @ApiProperty({
    description: 'Subtotal antes de descuentos en Pesos Argentinos (ARS)',
    example: 15000.0,
  })
  @IsNumber()
  subtotal: number;

  @ApiPropertyOptional({
    description: 'Monto de descuento aplicado en Pesos Argentinos (ARS)',
    example: 0.0,
  })
  @IsOptional()
  @IsNumber()
  descuento?: number;

  @ApiProperty({
    description: 'Monto total abonado en Pesos Argentinos (ARS)',
    example: 15000.0,
  })
  @IsNumber()
  total: number;

  @ApiProperty({
    description: 'Moneda de facturación',
    example: 'ARS',
    default: 'ARS',
  })
  @IsString()
  moneda: string;

  @ApiProperty({
    description: 'Método de pago o pasarela utilizada',
    example: 'Mercado Pago (Checkout Pro)',
  })
  @IsString()
  metodo_pago: string;

  @ApiPropertyOptional({
    description: 'Identificador de transacción certificado por Mercado Pago',
    example: '12345678901',
  })
  @IsOptional()
  @IsString()
  token_transaccion?: string | null;

  @ApiProperty({
    description: 'Estado actual del pago',
    example: 'Aprobado',
  })
  @IsString()
  estado: string;

  @ApiPropertyOptional({
    description: 'Nota de seguridad o verificación normativa',
    example:
      'Transacción validada según norma RNF-02 (PCI-DSS). No se almacenan datos sensibles de tarjetas bancarias.',
  })
  @IsOptional()
  @IsString()
  nota_seguridad?: string;

  @ApiPropertyOptional({
    description: 'Leyenda informativa al pie del documento',
    example:
      'Documento de control válido para acceso e ingreso a las instalaciones deportivas.',
  })
  @IsOptional()
  @IsString()
  leyenda_pie?: string;

  @ApiProperty({
    description:
      'Ruta relativa del endpoint oficial de visualización e impresión del comprobante',
    example: '/pagos/1/comprobante',
  })
  @IsString()
  comprobante_url: string;
}
