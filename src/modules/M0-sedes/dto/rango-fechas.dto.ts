import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';
import { FORMATO_FECHA } from '../utils/calendario.utils';

/** Filtro opcional por rango de fechas (ambos extremos incluidos). */
export class RangoFechasDto {
  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @Matches(FORMATO_FECHA, { message: 'desde debe tener formato YYYY-MM-DD' })
  desde?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @Matches(FORMATO_FECHA, { message: 'hasta debe tener formato YYYY-MM-DD' })
  hasta?: string;
}
