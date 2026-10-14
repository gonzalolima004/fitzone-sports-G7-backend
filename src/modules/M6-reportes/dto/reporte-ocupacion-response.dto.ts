import { ApiProperty } from '@nestjs/swagger';

export class MetricaOcupacionPorSedeDto {
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
    example: 150,
    description: 'Cantidad total de asistencias registradas',
  })
  total_asistencias: number;

  @ApiProperty({
    example: 45,
    description: 'Cantidad total de reservas de canchas',
  })
  total_reservas_canchas: number;

  @ApiProperty({
    example: 80,
    description: 'Cantidad total de reservas en clases grupales',
  })
  total_reservas_clases: number;
}

export class ReporteOcupacionResponseDto {
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
    type: [MetricaOcupacionPorSedeDto],
    description: 'Métricas de ocupación agrupadas por sede',
  })
  sedes: MetricaOcupacionPorSedeDto[];
}
