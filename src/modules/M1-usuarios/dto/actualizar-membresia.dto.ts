import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, Matches } from 'class-validator';

/**
 * Datos que el gerente puede modificar de la membresía de un socio.
 * El estado se cambia con PATCH /membresias/:id/estado.
 */
export class ActualizarMembresiaDto {
  @ApiProperty({
    example: '2026-12-31',
    description: 'Nueva fecha de vencimiento (YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha de fin debe tener el formato YYYY-MM-DD',
  })
  fecha_fin?: string;

  @ApiProperty({
    example: true,
    description: 'Indica si la membresía se renueva automáticamente',
    required: false,
  })
  @IsOptional()
  @IsBoolean({
    message: 'El campo renovacion_automatica debe ser un booleano',
  })
  renovacion_automatica?: boolean;
}
