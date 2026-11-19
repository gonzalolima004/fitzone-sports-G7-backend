import { ApiProperty } from '@nestjs/swagger';

export class SociosActivosPorSedeDto {
  @ApiProperty({ example: 1, description: 'ID de la sede' })
  id_sede: number;

  @ApiProperty({ example: 'Sede Centro', description: 'Nombre de la sede' })
  nombre_sede: string;

  @ApiProperty({
    example: 120,
    description: 'Socios de la sede con una membresía activa y vigente',
  })
  socios_activos: number;
}

export class ReporteSociosActivosResponseDto {
  @ApiProperty({
    example: '2026-11-18',
    description: 'Fecha en la que se contaron los socios activos',
  })
  fecha: string;

  @ApiProperty({
    example: 350,
    description: 'Socios activos de toda la cadena',
  })
  total_socios_activos: number;

  @ApiProperty({
    type: [SociosActivosPorSedeDto],
    description: 'Socios activos por sede de origen (solo sedes con socios)',
  })
  sedes: SociosActivosPorSedeDto[];
}
