import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MiInscripcionListaEsperaResponseDto {
  @ApiProperty({
    description: 'ID único de la inscripción en lista de espera',
    example: 4,
  })
  id_clase_lista_espera: number;

  @ApiProperty({ description: 'ID de la clase grupal', example: 3 })
  id_clase: number;

  @ApiProperty({ description: 'ID del usuario inscripto', example: 8 })
  id_usuario: number;

  @ApiProperty({
    description: 'Fecha y hora de inicio de la clase reservada',
    example: '2026-10-12T20:00:00.000Z',
  })
  fecha_inicio: Date | string;

  @ApiProperty({
    description: 'Fecha y hora de fin de la clase reservada',
    example: '2026-10-12T21:00:00.000Z',
  })
  fecha_fin: Date | string;

  @ApiProperty({
    description:
      'Posición actual en la cola de espera (1 = primero en la fila)',
    example: 2,
  })
  orden_en_cola: number;

  @ApiProperty({
    description: 'ID del estado de la inscripción en lista de espera',
    example: 1,
  })
  id_clase_lista_espera_estado: number;

  @ApiProperty({
    description: 'Descripción del estado de la inscripción',
    example: 'EN_ESPERA',
  })
  estado: string;

  @ApiPropertyOptional({
    description: 'Nombre descriptivo de la clase grupal',
    example: 'Crossfit Funcional',
  })
  nombre_clase?: string;
}
