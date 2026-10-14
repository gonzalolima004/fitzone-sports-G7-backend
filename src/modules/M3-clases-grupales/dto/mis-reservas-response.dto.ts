import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MiReservaClaseResponseDto {
  @ApiProperty({ description: 'ID único de la reserva de clase', example: 15 })
  id_clase_reserva: number;

  @ApiProperty({ description: 'ID de la clase reservada', example: 2 })
  id_clase: number;

  @ApiProperty({
    description: 'ID del usuario titular de la reserva',
    example: 8,
  })
  id_usuario: number;

  @ApiProperty({
    description: 'Fecha y hora de inicio de la reserva',
    example: '2026-10-12T18:30:00.000Z',
  })
  fecha_inicio: Date | string;

  @ApiProperty({
    description: 'Fecha y hora de fin de la reserva',
    example: '2026-10-12T19:30:00.000Z',
  })
  fecha_fin: Date | string;

  @ApiProperty({
    description: 'ID del estado de la reserva (1 = Confirmada, etc.)',
    example: 1,
  })
  id_clase_reserva_estado: number;

  @ApiProperty({
    description: 'Descripción del estado de la reserva',
    example: 'CONFIRMADA',
  })
  estado: string;

  @ApiPropertyOptional({
    description: 'Nombre de la clase reservada',
    example: 'Spinning Funcional',
  })
  nombre_clase?: string;
}
