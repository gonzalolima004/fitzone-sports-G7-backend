import { ApiProperty } from '@nestjs/swagger';

export class AccesoResponseDto {
  @ApiProperty({ description: 'ID del registro de acceso generado' })
  readonly id_registro_acceso: number;

  @ApiProperty({ description: 'Nombre completo del usuario' })
  readonly nombreUsuario: string;

  @ApiProperty({ description: 'Indica si el acceso fue autorizado o denegado' })
  readonly accesoPermitido: boolean;

  @ApiProperty({ description: 'Fecha y hora exacta del registro de ingreso' })
  readonly fechaIngreso: Date;

  constructor(partial: Partial<AccesoResponseDto>) {
    Object.assign(this, partial);
  }
}
