import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { FORMATO_HORA } from '../utils/calendario.utils';

/** Horario regular de una sede para un día de la semana. */
export class CreateSedeHorarioDto {
  @ApiProperty({
    example: 1,
    description: 'Día de la semana: 0 domingo, 1 lunes … 6 sábado',
  })
  @IsInt()
  @Min(0)
  @Max(6)
  dia_semana!: number;

  @ApiPropertyOptional({
    example: '07:00',
    description: 'Formato HH:mm. Obligatoria si la sede abre ese día.',
  })
  @IsOptional()
  @Matches(FORMATO_HORA, { message: 'hora_apertura debe tener formato HH:mm' })
  hora_apertura?: string;

  @ApiPropertyOptional({
    example: '23:00',
    description: 'Formato HH:mm. Obligatoria si la sede abre ese día.',
  })
  @IsOptional()
  @Matches(FORMATO_HORA, { message: 'hora_cierre debe tener formato HH:mm' })
  hora_cierre?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Por defecto true. Si es false, la sede no abre ese día.',
  })
  @IsOptional()
  @IsBoolean()
  abierto?: boolean;
}
