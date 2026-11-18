import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { FORMATO_FECHA, FORMATO_HORA } from '../utils/calendario.utils';

/**
 * Excepción de una sede para una fecha: cierre total o apertura con horario
 * especial. Si la fecha no está en el calendario general, se agrega como día
 * común.
 */
export class CreateCalendarioSedeDto {
  @ApiProperty({ example: '2026-12-24', description: 'Formato YYYY-MM-DD' })
  @Matches(FORMATO_FECHA, { message: 'fecha debe tener formato YYYY-MM-DD' })
  fecha!: string;

  @ApiPropertyOptional({
    example: false,
    description:
      'true: la sede cierra todo el día (por defecto). false: abre con el horario especial indicado. Si se envían horas sin este campo, se toma como apertura con horario especial.',
  })
  @IsOptional()
  @IsBoolean()
  cerrado?: boolean;

  @ApiPropertyOptional({ example: '09:00', description: 'Formato HH:mm' })
  @IsOptional()
  @Matches(FORMATO_HORA, { message: 'hora_apertura debe tener formato HH:mm' })
  hora_apertura?: string;

  @ApiPropertyOptional({ example: '13:00', description: 'Formato HH:mm' })
  @IsOptional()
  @Matches(FORMATO_HORA, { message: 'hora_cierre debe tener formato HH:mm' })
  hora_cierre?: string;

  @ApiPropertyOptional({
    example: 'Horario reducido por Nochebuena',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  motivo?: string;
}
