import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SedeHistorialDto {
  @ApiProperty({ description: 'ID de la sede', example: 1 })
  id_sede: number;

  @ApiProperty({ description: 'Nombre de la sede', example: 'Sede Central' })
  nombre: string;

  @ApiPropertyOptional({
    description: 'Dirección física de la sede',
    example: 'Av. Corrientes 1234',
  })
  direccion?: string;
}

export class ItemHistorialDto {
  @ApiProperty({
    description: 'Identificador único compuesto o ID de la reserva',
    example: 'cancha-12',
  })
  id: string;

  @ApiProperty({
    description: 'Tipo de actividad realizada',
    enum: ['cancha', 'clase'],
    example: 'cancha',
  })
  tipo: 'cancha' | 'clase';

  @ApiProperty({
    description: 'Título o nombre de la actividad',
    example: 'Cancha de Pádel 1',
  })
  titulo: string;

  @ApiPropertyOptional({
    description:
      'Subtítulo o detalle adicional (ej. Profesor o Tipo de cancha)',
    example: 'Césped Sintético',
  })
  subtitulo?: string;

  @ApiProperty({
    description: 'Fecha y hora de inicio de la reserva',
    example: '2026-11-20T18:00:00.000Z',
  })
  fecha_inicio: string;

  @ApiProperty({
    description: 'Fecha y hora de fin de la reserva',
    example: '2026-11-20T19:30:00.000Z',
  })
  fecha_fin: string;

  @ApiPropertyOptional({
    description:
      'Fecha y hora en que se realizó la reserva (null en reservas anteriores al registro de este dato)',
    example: '2026-11-17T21:30:00.000Z',
    nullable: true,
  })
  fecha_creacion?: string | null;

  @ApiProperty({
    description: 'Estado actual de la reserva',
    example: 'Confirmada',
  })
  estado: string;

  @ApiProperty({
    description: 'Información de la sede donde se realiza la actividad',
    type: SedeHistorialDto,
  })
  sede: SedeHistorialDto;

  @ApiPropertyOptional({
    description: 'Precio o costo de la reserva si aplica',
    example: 4500.5,
  })
  precio?: number;
}

export class PaginacionMetaDto {
  @ApiProperty({ description: 'Total de registros encontrados', example: 25 })
  total: number;

  @ApiProperty({ description: 'Página actual', example: 1 })
  page: number;

  @ApiProperty({ description: 'Cantidad de elementos por página', example: 10 })
  limit: number;

  @ApiProperty({ description: 'Total de páginas calculadas', example: 3 })
  total_paginas: number;
}

export class HistorialResponseDto {
  @ApiProperty({
    description: 'Lista paginada de actividades en el historial',
    type: [ItemHistorialDto],
  })
  items: ItemHistorialDto[];

  @ApiProperty({
    description: 'Metadatos de paginación',
    type: PaginacionMetaDto,
  })
  meta: PaginacionMetaDto;
}
