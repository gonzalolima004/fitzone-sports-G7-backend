import { ApiProperty } from '@nestjs/swagger';

export class AforoPorSedeDto {
  @ApiProperty({ example: 1, description: 'ID de la sede' })
  id_sede: number;

  @ApiProperty({ example: 'Sede Centro', description: 'Nombre de la sede' })
  nombre_sede: string;

  @ApiProperty({
    example: 45,
    description: 'Personas que ingresaron y todavía no registraron el egreso',
  })
  aforo_actual: number;

  @ApiProperty({ example: 100, description: 'Aforo máximo de la sede' })
  aforo_maximo: number;
}

export class ReporteAforoResponseDto {
  @ApiProperty({
    example: 151,
    description: 'Personas dentro de todas las sedes activas',
  })
  total_aforo_actual: number;

  @ApiProperty({
    example: 230,
    description: 'Suma del aforo máximo de las sedes activas',
  })
  total_aforo_maximo: number;

  @ApiProperty({
    type: [AforoPorSedeDto],
    description: 'Aforo actual y máximo de cada sede activa',
  })
  sedes: AforoPorSedeDto[];
}
