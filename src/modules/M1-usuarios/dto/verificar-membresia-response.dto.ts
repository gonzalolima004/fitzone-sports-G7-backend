import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class VerificarMembresiaResponseDto {
  @Expose()
  @ApiProperty({
    example: 1,
    description: 'ID del usuario verificado',
  })
  id_usuario: number;

  @Expose()
  @ApiProperty({
    example: true,
    description: 'Indica si el socio cuenta con una membresía activa vigente',
  })
  esSocioActivo: boolean;

  @Expose()
  @ApiProperty({
    example: false,
    description: 'Indica si el socio se encuentra en mora / cuota vencida',
  })
  enMora: boolean;

  @Expose()
  @ApiProperty({
    example: 1,
    description: 'ID de la sede de origen del usuario',
  })
  id_sede_origen: number;

  @Expose()
  @ApiProperty({
    example: '2026-10-25T00:00:00.000Z',
    description:
      'Fecha de vencimiento de la membresía activa o última registrada',
    nullable: true,
  })
  fecha_vencimiento: Date | null;

  @Expose()
  @ApiProperty({
    example: 'Plan Mensual',
    description: 'Nombre del plan contratado (opcional)',
    required: false,
  })
  nombre_plan?: string | null;

  @Expose()
  @ApiProperty({
    example: 'Socio activo habilitado para acceso multi-sede y beneficios.',
    description: 'Mensaje explicativo del estado de permisos del socio',
  })
  mensaje: string;
}
