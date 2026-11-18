import { ApiProperty } from '@nestjs/swagger';
import { ItemHistorialDto } from './historial-response.dto';

export class MembresiaResumenDto {
  @ApiProperty({ description: 'ID de la membresía', example: 5 })
  id_membresia: number;

  @ApiProperty({
    description: 'Nombre del plan de membresía',
    example: 'Pase Libre Black',
  })
  plan: string;

  @ApiProperty({
    description: 'Estado actual de la membresía',
    example: 'Activa',
  })
  estado: string;

  @ApiProperty({
    description: 'Fecha de inicio de vigencia',
    example: '2026-11-01',
  })
  fecha_inicio: string;

  @ApiProperty({ description: 'Fecha de vencimiento', example: '2026-12-01' })
  fecha_fin: string;

  @ApiProperty({ description: 'Días restantes de membresía', example: 17 })
  dias_restantes: number;

  @ApiProperty({
    description: 'Si tiene habilitada la renovación automática',
    example: true,
  })
  renovacion_automatica: boolean;
}

export class TotalesActividadesDto {
  @ApiProperty({
    description: 'Total histórico de reservas de canchas',
    example: 14,
  })
  total_canchas: number;

  @ApiProperty({
    description: 'Total histórico de inscripciones a clases grupales',
    example: 8,
  })
  total_clases: number;

  @ApiProperty({
    description: 'Total global combinado de actividades',
    example: 22,
  })
  total_actividades: number;

  @ApiProperty({
    description: 'Cantidad de reservas futuras confirmadas',
    example: 3,
  })
  proximas_confirmadas: number;
}

export class SocioDashboardResponseDto {
  @ApiProperty({
    description:
      'Resumen del estado de la membresía activa del socio (o null si no tiene)',
    type: MembresiaResumenDto,
    nullable: true,
  })
  membresia: MembresiaResumenDto | null;

  @ApiProperty({
    description: 'Estadísticas y totales de actividad del socio',
    type: TotalesActividadesDto,
  })
  totales: TotalesActividadesDto;

  @ApiProperty({
    description: 'Próximas actividades programadas ordenadas cronológicamente',
    type: [ItemHistorialDto],
  })
  proximas_actividades: ItemHistorialDto[];
}
