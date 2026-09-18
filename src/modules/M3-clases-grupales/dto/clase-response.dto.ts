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

  @ApiProperty({
    description: 'Indica si la clase está activa',
    example: true,
  })
  activo: boolean;
}
