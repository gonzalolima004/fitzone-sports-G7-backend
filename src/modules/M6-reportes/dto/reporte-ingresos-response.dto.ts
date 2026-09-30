import { ApiProperty } from '@nestjs/swagger';

export class IngresoPorSedeDto {
  @ApiProperty({
    example: 1,
    description: 'ID de la sede',
  })
  id_sede: number;

  @ApiProperty({
    example: 'Sede Centro',
    description: 'Nombre de la sede',
  })
  nombre_sede: string;

  @ApiProperty({
    example: 100000,
    description: 'Total de ingresos de la sede',
  })
  total_ingresos: number;
}

export class ReporteIngresosResponseDto {
  @ApiProperty({
    example: '2026-09-01',
    description: 'Fecha inicial del reporte',
  })
  fecha_desde: string;

  @ApiProperty({
    example: '2026-09-30',
    description: 'Fecha final del reporte',
  })
  fecha_hasta: string;

  @ApiProperty({
    example: 200000,
    description: 'Total consolidado de ingresos',
  })
  total_ingresos: number;

  @ApiProperty({
    type: [IngresoPorSedeDto],
    description: 'Ingresos agrupados por sede',
  })
  sedes: IngresoPorSedeDto[];
}
