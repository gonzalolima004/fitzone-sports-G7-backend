import {
  IsDateString,
  IsOptional,
  IsPositive,
  IsEnum,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum ConceptoIngreso {
  CANCHA = 'cancha',
  MEMBRESIA = 'membresia',
}

export class ConsultaIngresosDto {
  @ApiProperty({
    example: '2026-09-01',
    description: 'Fecha inicial del reporte',
  })
  @IsDateString()
  fecha_desde: string;

  @ApiProperty({
    example: '2026-09-30',
    description: 'Fecha final del reporte',
  })
  @IsDateString()
  fecha_hasta: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID de la sede a filtrar',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  id_sede?: number;

  @ApiPropertyOptional({
    enum: ConceptoIngreso,
    example: ConceptoIngreso.MEMBRESIA,
    description: 'Concepto de ingreso a filtrar',
  })
  @IsOptional()
  @IsEnum(ConceptoIngreso)
  concepto?: ConceptoIngreso;
}
