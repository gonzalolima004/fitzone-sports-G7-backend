import { ApiProperty } from '@nestjs/swagger';

import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
} from 'class-validator';

import { Type } from 'class-transformer';

export class ValidacionReglaAccesoDto {
  @ApiProperty({
    description: 'Indica si el acceso cumple con todas las reglas de negocio',

    example: false,
  })
  @IsBoolean()
  @IsNotEmpty()
  readonly esValido: boolean;

  @ApiProperty({
    description: 'Código de la regla violada en caso de rechazo',

    example: 'RN-01',

    required: false,
  })
  @IsString()
  @IsOptional()
  readonly codigoRegla?: string;

  @ApiProperty({
    description: 'Mensaje explicativo del motivo de rechazo o aprobación',

    example:
      'El usuario ya posee una sesión activa en otra sede sin egreso registrado.',
  })
  @IsString()
  @IsNotEmpty()
  readonly mensaje: string;

  @ApiProperty({
    description:
      'Identificador de la sede donde se encuentra la sesión activa previa',

    example: 2,

    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  readonly idSedeActiva?: number;
}
