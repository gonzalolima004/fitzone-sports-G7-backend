import { ApiProperty } from '@nestjs/swagger';

export class ReservaCanchaResponseDto {
  @ApiProperty({ example: 1 })
  id_cancha_reserva: number;

  @ApiProperty({ example: 1 })
  id_cancha: number;

  @ApiProperty({ example: '2026-10-15T10:00:00Z' })
  fecha_inicio: Date;

  @ApiProperty({ example: '2026-10-15T11:00:00Z' })
  fecha_fin: Date;

  @ApiProperty({ example: 4250.0 })
  precio_congelado: number;

  @ApiProperty({ example: 15.0 })
  descuento_porcentaje: number;

  @ApiProperty({ example: false })
  es_horario_pico: boolean;
}
