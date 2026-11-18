import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  Matches,
} from 'class-validator';

export class CotizacionContext {
  @ApiProperty({
    description: 'Indica si el usuario tiene una membresía activa y al día',
  })
  esSocioActivo: boolean;

  @ApiProperty({
    description: 'Hora de inicio de la reserva para evaluar si es horario pico',
  })
  horaInicio: Date;
}

export class ResultadoPrecio {
  @ApiProperty({
    description: 'Precio final calculado que se congelará en la reserva',
  })
  precio_congelado: number;

  @ApiProperty({
    description: 'Porcentaje de descuento aplicado (0 si no aplica)',
  })
  descuento_porcentaje: number;

  @ApiProperty({
    description: 'Indica si se aplicó un recargo por horario pico',
  })
  es_horario_pico: boolean;
}

export class CotizarTurnoQueryDto {
  @ApiProperty({
    example: 1,
    description: 'ID de la cancha a cotizar',
  })
  @Type(() => Number)
  @IsInt({ message: 'El id de la cancha debe ser un número entero' })
  @IsPositive({ message: 'El id de la cancha debe ser positivo' })
  @IsNotEmpty({ message: 'El id de la cancha es obligatorio' })
  canchaId: number;

  @ApiProperty({
    example: '2026-11-15',
    description: 'Fecha del turno a cotizar (Formato YYYY-MM-DD)',
  })
  @IsString({ message: 'La fecha debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La fecha es obligatoria' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha debe tener formato YYYY-MM-DD',
  })
  fecha: string;

  @ApiProperty({
    example: '19:00',
    description: 'Hora de inicio del turno (Formato HH:mm ej: 19:00)',
  })
  @IsString({ message: 'La hora debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La hora es obligatoria' })
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/, {
    message: 'La hora debe tener formato HH:mm (ej: 19:00)',
  })
  hora: string;
}

export type MotivoSinDescuento =
  'OTRA_CIUDAD' | 'SIN_MEMBRESIA' | 'ROL_EXTERNO' | null;

export class CotizacionResponseDto {
  @ApiProperty({
    example: 12000,
    description: 'Tarifa base de la cancha consultada',
  })
  costo_base: number;

  @ApiProperty({
    example: 15,
    description: 'Porcentaje de descuento de socio aplicado (15 o 0)',
  })
  descuento_porcentaje: number;

  @ApiProperty({
    example: 1800,
    description: 'Monto monetario de descuento aplicado',
  })
  monto_descuento: number;

  @ApiProperty({
    example: true,
    description: 'Indica si el turno inicia en horario pico (19:00 a 21:00 hs)',
  })
  es_horario_pico: boolean;

  @ApiProperty({
    example: 2400,
    description: 'Monto monetario de recargo por horario pico (+20%)',
  })
  monto_recargo_pico: number;

  @ApiProperty({
    example: 12600,
    description:
      'Precio final calculado (costo_base - monto_descuento + monto_recargo_pico)',
  })
  precio_final: number;

  @ApiProperty({
    example: true,
    description: 'Indica si el usuario tiene rol de socio',
  })
  es_socio: boolean;

  @ApiProperty({
    example: true,
    description: 'Indica si aplica efectivamente el descuento de socio',
  })
  aplica_descuento_socio: boolean;

  @ApiProperty({
    example: null,
    nullable: true,
    enum: ['OTRA_CIUDAD', 'SIN_MEMBRESIA', 'ROL_EXTERNO', null],
    description:
      'Motivo por el cual no aplica el descuento de socio (null si aplica)',
  })
  motivo_sin_descuento: MotivoSinDescuento;
}
