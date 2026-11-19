import { IsDateString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ConsultaSociosActivosDto {
  @ApiPropertyOptional({
    example: '2026-11-18',
    description:
      'Fecha en la que se cuentan los socios activos (YYYY-MM-DD). Si no se envía, se usa la fecha de hoy en Argentina.',
  })
  @IsOptional()
  @IsDateString({ strict: true })
  fecha?: string;
}
