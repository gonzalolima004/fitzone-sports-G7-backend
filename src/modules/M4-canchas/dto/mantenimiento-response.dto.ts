import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MantenimientoResponseDto {
  @ApiProperty({ example: 1 })
  id_cancha_mantenimiento: number;

  @ApiProperty({ example: 1 })
  id_cancha: number;

  @ApiProperty({ example: '2026-10-20T08:00:00Z' })
  fecha_inicio: Date;

  @ApiProperty({ example: '2026-10-20T12:00:00Z' })
  fecha_fin: Date;

  @ApiPropertyOptional({ example: 'Reparación de red e iluminación' })
  motivo?: string;
}
