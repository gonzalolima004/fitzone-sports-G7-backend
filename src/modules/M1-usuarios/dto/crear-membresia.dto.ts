import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateMembresiaDto {
  @ApiProperty({
    example: '2024-01-01',
    description: 'Fecha de inicio de la membresía',
  })
  @IsNotEmpty({ message: 'La fecha de inicio es requerida' })
  @IsString({ message: 'La fecha de inicio debe ser una cadena' })
  fecha_inicio: string;

  @ApiProperty({
    example: '2025-01-01',
    description: 'Fecha de fin de la membresía',
  })
  @IsNotEmpty({ message: 'La fecha de fin es requerida' })
  @IsString({ message: 'La fecha de fin debe ser una cadena' })
  fecha_fin: string;
  @ApiProperty({
    example: true,
    description:
      'Indica si la membresía se renovará automáticamente al finalizar',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({
    message: 'El campo renovacion_automatica debe ser un booleano',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string'
      ? value === 'true' || value === '1'
      : Boolean(value),
  )
  renovacion_automatica?: boolean;

  @ApiProperty({
    example: 1,
    description: 'ID del usuario al que se le asigna la membresía',
  })
  @IsNotEmpty({ message: 'El ID del usuario no puede estar vacío' })
  @IsNumber({}, { message: 'El ID del usuario debe ser un número' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? Number(value) : value,
  )
  id_usuario: number;

  @ApiProperty({
    example: 1,
    description: 'ID del plan de membresía a contratar',
  })
  @IsNotEmpty({ message: 'El ID del plan de membresía no puede estar vacío' })
  @IsNumber({}, { message: 'El ID del plan debe ser un número' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? Number(value) : value,
  )
  id_membresia_plan: number;

  //NOTA: Por defecto es 1 (Activo) por ahora, es decir, apenas se crea ya está activa
  @ApiProperty({
    example: 1,
    description: 'ID del estado de la membresía',
    required: false,
    default: 1,
  })
  @IsOptional()
  @IsNumber(
    {},
    { message: 'El ID del estado de la membresía debe ser un número' },
  )
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? Number(value) : value,
  )
  id_membresia_estado: number = 1;

  /*
  //NOTA: Podríamos pasarle el token de la pasarela para crearlas en el futuro.
  @ApiProperty({
    example: 'tok_123456789',
    description:
      'Token provisto por la pasarela de pagos (opcional)',
    required: false,
  })
  @IsOptional()
  @IsString({
    message: 'El token de pasarela debe ser una cadena de texto',
  })
  token_pasarela?: string;
  */
}
