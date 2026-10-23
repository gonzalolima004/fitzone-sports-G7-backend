import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClaseAgendaResponseDto {
  @ApiProperty({
    description: 'Identificador único de la clase grupal',
    example: 1,
  })
  id_clase: number;

  @ApiProperty({
    description: 'ID de la sede donde se dicta la clase',
    example: 1,
  })
  id_sede: number;

  @ApiProperty({
    description: 'Nombre descriptivo de la clase',
    example: 'Spinning Avanzado',
  })
  nombre: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada de la clase',
    example: 'Clase de ciclismo indoor de alta intensidad.',
  })
  descripcion: string | null;

  @ApiPropertyOptional({
    description: 'Nombre del profesor o instructor asignado',
    example: 'Martín González',
  })
  profesor: string | null;

  @ApiPropertyOptional({
    description: 'Sala o espacio asignado',
    example: 'Sala 1 - Ciclismo',
  })
  sala: string | null;

  @ApiProperty({
    description: 'Horario de inicio en formato HH:mm',
    example: '18:00',
  })
  horario_inicio: string;

  @ApiProperty({
    description: 'Horario de fin en formato HH:mm',
    example: '19:00',
  })
  horario_fin: string;

  @ApiProperty({
    description: 'Fecha y hora de inicio de la clase en formato ISO',
    example: '2026-10-12T18:00:00.000Z',
  })
  fecha_inicio: string;

  @ApiProperty({
    description: 'Fecha y hora de fin de la clase en formato ISO',
    example: '2026-10-12T19:00:00.000Z',
  })
  fecha_fin: string;

  @ApiProperty({
    description: 'Capacidad máxima de participantes',
    example: 20,
  })
  capacidad_maxima: number;

  @ApiProperty({
    description:
      'Cantidad de cupos actualmente ocupados (reservas confirmadas)',
    example: 5,
  })
  cupos_ocupados: number;

  @ApiProperty({
    description: 'Cantidad de cupos aún disponibles para reservar',
    example: 15,
  })
  cupos_disponibles: number;

  @ApiProperty({
    description: 'Cantidad de socios actualmente en lista de espera',
    example: 0,
  })
  en_espera: number;

  @ApiProperty({
    description: 'Estado de disponibilidad de la clase para ese horario',
    example: 'DISPONIBLE',
    enum: ['DISPONIBLE', 'COMPLETO'],
  })
  estado: 'DISPONIBLE' | 'COMPLETO';

  @ApiProperty({
    description:
      'Días de la semana en los que se dicta la clase (0 = Domingo, 1 = Lunes, ..., 6 = Sábado)',
    example: [1, 3, 5],
    type: [Number],
  })
  dias_semana: number[];

  @ApiPropertyOptional({
    description:
      'Fecha puntual de la clase en formato YYYY-MM-DD (para clases de única edición o eventos especiales)',
    example: '2026-10-25',
  })
  fecha?: string | null;

  @ApiProperty({
    description: 'Indica si la clase está activa',
    example: true,
  })
  activo: boolean;
}
