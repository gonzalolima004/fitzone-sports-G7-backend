import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
@Exclude()
export class PlanResponseDto {
  @ApiProperty({ example: 1, description: 'ID del plan' })
  @Expose()
  id_plan: number;
  @ApiProperty({ example: 'Plan Mensual', description: 'Nombre del plan' })
  @Expose()
  nombre: string;
  @ApiProperty({ example: 30, description: 'Duración del plan en días' })
  @Expose()
  duracion_dias: number;
  @ApiProperty({ example: 25000.0, description: 'Precio del plan' })
  @Expose()
  precio: number;
}
