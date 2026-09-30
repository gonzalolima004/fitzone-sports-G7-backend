import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsPositive } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConsultaMetricasOcupacionDto {
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
}
