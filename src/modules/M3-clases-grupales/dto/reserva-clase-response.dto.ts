import { ApiProperty } from '@nestjs/swagger';

export class ReservaClaseResponseDto {
  @ApiProperty({ description: 'ID único de la reserva de clase', example: 1 })
  id_clase_reserva: number;

  @ApiProperty({ description: 'ID de la clase reservada', example: 1 })
  id_clase: number;

  @ApiProperty({
    description: 'ID del usuario titular de la reserva',
    example: 1,
  })
  id_usuario: number;

  @ApiProperty({
    description:
      'ID del estado de la reserva (ej: 1 = Confirmada, 2 = Cancelada)',
    example: 1,
  })
  id_clase_reserva_estado: number;

  @ApiProperty({
    description: 'Fecha y hora de inicio de la reserva',
    example: '2026-09-22T10:00:00Z',
  })
  fecha_inicio: Date;

  @ApiProperty({
    description: 'Fecha y hora de fin de la reserva',
    example: '2026-09-22T11:00:00Z',
  })
  fecha_fin: Date;
}
