import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class MembresiaResponseDto {
  @Expose()
  @ApiProperty({
    example: 1,
    description: 'ID de la membresía',
  })
  id_membresia: number;
  @Expose()
  @ApiProperty({
    example: '2024-01-01',
    description: 'Fecha de inicio de la membresía',
  })
  fecha_inicio: Date;
  @Expose()
  @ApiProperty({
    example: '2025-01-01',
    description: 'Fecha de fin de la membresía',
  })
  fecha_fin: Date;
  @Expose()
  @ApiProperty({
    example: true,
    description:
      'Indica si la membresía se renovará automáticamente al finalizar',
  })
  renovacion_automatica: boolean;
  @Expose()
  @ApiProperty({
    example: 1,
    description: 'ID del usuario al que se le asigna la membresía',
  })
  id_usuario: number;
  //NOTA: Podríamos usar en realidad los dto de las respectivas entidades.
  @Expose()
  @ApiProperty({
    example: 1,
    description: 'ID del plan de membresía',
  })
  id_membresia_plan: number;
  @Expose()
  @ApiProperty({
    example: 1,
    description: 'ID del estado de la membresía',
  })
  id_membresia_estado: number;
}
