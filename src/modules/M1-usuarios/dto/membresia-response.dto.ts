import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';

/** Datos del plan contratado que acompañan a cada membresía. */
@Exclude()
export class MembresiaPlanResumenDto {
  @Expose()
  @ApiProperty({ example: 1, description: 'ID del plan de membresía' })
  id_membresia_plan: number;

  @Expose()
  @ApiProperty({ example: 'Plan Mensual', description: 'Nombre del plan' })
  nombre: string;

  @Expose()
  @ApiProperty({ example: 30, description: 'Duración del plan en días' })
  duracion_dias: number;

  // Prisma devuelve el precio como Decimal: se convierte a número.
  @Expose()
  @Type(() => Number)
  @ApiProperty({ example: 25000, description: 'Precio del plan' })
  precio: number;
}

/** Estado de la membresía, tomado de la tabla membresia_estado. */
@Exclude()
export class MembresiaEstadoDto {
  @Expose()
  @ApiProperty({ example: 1, description: 'ID del estado de membresía' })
  id_membresia_estado: number;

  @Expose()
  @ApiProperty({ example: 'Activa', description: 'Nombre del estado' })
  descripcion: string;
}

/** Datos básicos del socio titular de la membresía. */
@Exclude()
export class MembresiaSocioDto {
  @Expose()
  @ApiProperty({ example: 1, description: 'ID del usuario' })
  id_usuario: number;

  @Expose()
  @ApiProperty({ example: 'Sofía', description: 'Nombre del socio' })
  nombre: string;

  @Expose()
  @ApiProperty({ example: 'Gómez', description: 'Apellido del socio' })
  apellido: string;

  @Expose()
  @ApiProperty({ example: '30111222', description: 'DNI del socio' })
  dni: string;

  @Expose()
  @ApiProperty({ example: 'sofia@mail.com', description: 'Email del socio' })
  email: string;
}

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

  @Expose()
  @Type(() => MembresiaPlanResumenDto)
  @ApiProperty({ type: MembresiaPlanResumenDto, required: false })
  membresia_plan?: MembresiaPlanResumenDto;

  @Expose()
  @Type(() => MembresiaEstadoDto)
  @ApiProperty({ type: MembresiaEstadoDto, required: false })
  membresia_estado?: MembresiaEstadoDto;

  @Expose()
  @Type(() => MembresiaSocioDto)
  @ApiProperty({ type: MembresiaSocioDto, required: false })
  usuario?: MembresiaSocioDto;
}
