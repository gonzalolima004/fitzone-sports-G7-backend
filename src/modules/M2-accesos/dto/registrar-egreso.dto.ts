import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsDate,
  IsString,
  IsOptional,
} from 'class-validator';

export class RegistrarEgresoDto {
  @ApiProperty({
    description: 'Token QR dinámico del socio que registra su salida física',
    example: '7.179199573.3d696a27f6dfa960',
  })
  @IsString({ message: 'El qrToken debe ser un texto válido' })
  @IsNotEmpty({ message: 'El qrToken es obligatorio' })
  qrToken: string;

  @ApiProperty({
    description: 'ID de la sede donde se encuentra el torniquete de egreso',
    example: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'El id_sede debe ser un número entero' })
  @IsPositive({ message: 'El id_sede debe ser mayor a 0' })
  @IsNotEmpty({ message: 'El id_sede es obligatorio' })
  id_sede: number;

  @ApiProperty({
    description:
      'Fecha y hora de egreso en formato ISO 8601 (opcional). Si se omite, se utiliza la fecha/hora actual del sistema.',
    example: '2026-09-26T18:30:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate({
    message:
      'La fecha_egreso debe ser una fecha y hora válida en formato ISO 8601',
  })
  fecha_egreso?: Date;
}
