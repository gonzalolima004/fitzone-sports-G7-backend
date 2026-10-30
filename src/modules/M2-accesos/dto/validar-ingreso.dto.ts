import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ValidarIngresoDto {
  @ApiProperty({
    description: 'Token efímero del código QR dinámico (TOTP)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly qrToken?: string;

  @ApiProperty({
    description: 'Número de DNI del socio para validación manual',
    example: '38456789',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d+$/, { message: 'El DNI solo debe contener números' })
  readonly dni?: string;

  @ApiProperty({
    description: 'Identificador único de la sede donde se intenta el ingreso',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  readonly id_sede: number;
}
