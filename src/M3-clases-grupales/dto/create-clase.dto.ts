import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  IsBoolean,
} from 'class-validator';

export class CreateClaseDto {
  @ApiProperty({
    description: 'ID de la sede donde se dictará la clase',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  id_sede: number;

  @ApiProperty({
    description: 'Capacidad máxima de participantes para la clase',
    example: 20,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  capacidad_maxima: number;

  @ApiProperty({
    description: 'Nombre descriptivo de la clase',
    example: 'Spinning Funcional',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada de la clase',
    example:
      'Clase de spinning de alta intensidad combinada con ejercicios funcionales.',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  descripcion?: string;

  @ApiPropertyOptional({
    description: 'Indica si la clase está activa para recibir reservas',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
