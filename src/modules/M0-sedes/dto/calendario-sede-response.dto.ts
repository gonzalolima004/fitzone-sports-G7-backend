import { ApiProperty } from '@nestjs/swagger';
import { CalendarioResponseDto } from './calendario-response.dto';

export class CalendarioSedeResponseDto {
  @ApiProperty({ example: 1 })
  id_calendario_sede!: number;

  @ApiProperty({ example: 1 })
  id_sede!: number;

  @ApiProperty({ example: 3 })
  id_calendario!: number;

  @ApiProperty({ example: '2026-12-24', description: 'Formato YYYY-MM-DD' })
  fecha!: string;

  @ApiProperty({ example: false })
  cerrado!: boolean;

  @ApiProperty({ example: '09:00', nullable: true, type: String })
  hora_apertura!: string | null;

  @ApiProperty({ example: '13:00', nullable: true, type: String })
  hora_cierre!: string | null;

  @ApiProperty({
    example: 'Horario reducido por Nochebuena',
    nullable: true,
    type: String,
  })
  motivo!: string | null;

  @ApiProperty({
    type: CalendarioResponseDto,
    description: 'Fecha del calendario general (por ejemplo, si es feriado)',
  })
  calendario!: CalendarioResponseDto;
}
