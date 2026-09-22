import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  MaxLength,
} from 'class-validator';

export class CrearCanchaDto {
  @ApiProperty({
    example: 'Cancha 1 - Césped Sintético',
    description: 'Nombre identificador de la cancha',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  nombre: string;

  @ApiProperty({
    example: 5000.5,
    description: 'Costo base por hora de la cancha',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  costo_base: number;

  @ApiProperty({
    example: 1,
    description: 'ID del tipo de cancha (ej: Fútbol 5, Paddle)',
  })
  @IsNumber()
  @IsPositive()
  id_cancha_tipo: number;

  @ApiProperty({ example: 3, description: 'ID de la sede a la que pertenece' })
  @IsNumber()
  @IsPositive()
  id_sede: number;
}
