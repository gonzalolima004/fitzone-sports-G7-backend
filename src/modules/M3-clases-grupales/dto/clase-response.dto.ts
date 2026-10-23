import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClaseResponseDto {
  @ApiProperty({
    description: 'Identificador único de la clase grupal',
    example: 10,
  })
  id_clase: number;

  @ApiProperty({
    description: 'ID de la sede donde se dicta la clase',
    example: 1,
  })
  id_sede: number;

  @ApiProperty({
    description: 'Nombre descriptivo de la clase',
    example: 'Spinning Funcional',
  })
  nombre: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada de la clase',
    example:
      'Clase de spinning de alta intensidad combinada con ejercicios funcionales.',
  })
  descripcion: string | null;

  @ApiProperty({
    description: 'Capacidad máxima de participantes',
    example: 20,
  })
  capacidad_maxima: number;

  @ApiPropertyOptional({
    description: 'Nombre del profesor o instructor asignado',
    example: 'Martín González',
  })
  profesor?: string | null;

  @ApiPropertyOptional({
    description: 'Sala o espacio asignado',
    example: 'Sala 1 - Ciclismo',
  })
  sala?: string | null;

  @ApiProperty({
    description: 'Horario habitual de inicio en formato HH:mm',
    example: '18:00',
  })
  horario_inicio: string;

  @ApiProperty({
    description: 'Horario habitual de fin en formato HH:mm',
    example: '19:00',
  })
  horario_fin: string;

  @ApiProperty({
    description:
      'Fecha y hora calculada de inicio en formato ISO 8601 estricto',
    example: '2026-10-20T21:00:00.000Z',
  })
  fecha_inicio: string;

  @ApiProperty({
    description: 'Fecha y hora calculada de fin en formato ISO 8601 estricto',
    example: '2026-10-20T22:00:00.000Z',
  })
  fecha_fin: string;

  @ApiProperty({
    description: 'Indica si la clase está activa',
    example: true,
  })
  activo: boolean;
}
