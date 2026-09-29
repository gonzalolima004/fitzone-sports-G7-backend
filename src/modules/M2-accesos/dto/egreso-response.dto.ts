import { ApiProperty } from '@nestjs/swagger';

export class EgresoResponseDto {
  @ApiProperty({
    example: 105,
    description: 'ID del registro de acceso cerrado',
  })
  id_registro_acceso: number;

  @ApiProperty({ example: 42, description: 'ID del usuario' })
  id_usuario: number;

  @ApiProperty({ example: 1, description: 'ID de la sede' })
  id_sede: number;

  @ApiProperty({
    example: '2026-09-26T18:00:00.000Z',
    description: 'Fecha y hora de ingreso',
  })
  fechaIngreso: Date;

  @ApiProperty({
    example: '2026-09-26T19:30:00.000Z',
    description: 'Fecha y hora de egreso',
  })
  fechaEgreso: Date;

  @ApiProperty({
    example: 'Egreso registrado con éxito.',
    description: 'Mensaje descriptivo del resultado',
  })
  mensaje: string;

  constructor(partial: Partial<EgresoResponseDto>) {
    Object.assign(this, partial);
  }
}
