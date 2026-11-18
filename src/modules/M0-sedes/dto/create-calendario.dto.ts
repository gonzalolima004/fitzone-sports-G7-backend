import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { FORMATO_FECHA } from '../utils/calendario.utils';

export class CreateCalendarioDto {
  @ApiProperty({
    example: '2026-12-25',
    description: 'Fecha en formato YYYY-MM-DD',
  })
  @Matches(FORMATO_FECHA, { message: 'fecha debe tener formato YYYY-MM-DD' })
  fecha!: string;

  @ApiPropertyOptional({ example: 'Navidad', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  descripcion?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Feriado nacional o para todas las sedes. Por defecto false.',
  })
  @IsOptional()
  @IsBoolean()
  es_feriado?: boolean;

  @ApiPropertyOptional({
    example: false,
    description:
      'Por defecto true. Si se marca como feriado y no se indica, queda en false.',
  })
  @IsOptional()
  @IsBoolean()
  es_dia_habil?: boolean;
}
