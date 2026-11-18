import { ApiProperty } from '@nestjs/swagger';

export class SedeHorarioResponseDto {
  @ApiProperty({ example: 1 })
  id_sede_horario!: number;

  @ApiProperty({ example: 1 })
  id_sede!: number;

  @ApiProperty({ example: 1, description: '0 domingo, 1 lunes … 6 sábado' })
  dia_semana!: number;

  @ApiProperty({ example: '07:00' })
  hora_apertura!: string;

  @ApiProperty({ example: '23:00' })
  hora_cierre!: string;

  @ApiProperty({ example: true })
  abierto!: boolean;
}
