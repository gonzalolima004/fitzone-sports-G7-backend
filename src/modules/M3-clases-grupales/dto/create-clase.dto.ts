import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  Max,
  IsBoolean,
  IsArray,
  IsDateString,
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
    description: 'Nombre del profesor o instructor a cargo',
    example: 'Martín González',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  profesor?: string;

  @ApiPropertyOptional({
    description: 'Sala o espacio asignado para la clase',
    example: 'Sala 1 - Ciclismo',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  sala?: string;

  @ApiPropertyOptional({
    description: 'Horario habitual de inicio (formato HH:mm)',
    example: '18:00',
    maxLength: 10,
  })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  horario_inicio?: string;

  @ApiPropertyOptional({
    description: 'Horario habitual de fin (formato HH:mm)',
    example: '19:00',
    maxLength: 10,
  })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  horario_fin?: string;

  @ApiPropertyOptional({
    description:
      'Días de la semana en los que se dicta la clase (0 = Domingo, 1 = Lunes, ..., 6 = Sábado)',
    example: [1, 3, 5],
    type: [Number],
  })
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  @IsOptional()
  dias_semana?: number[];

  @ApiPropertyOptional({
    description:
      'Fecha puntual de la clase en formato YYYY-MM-DD (para clases de única edición o eventos especiales)',
    example: '2026-10-25',
  })
  @IsDateString()
  @IsOptional()
  fecha?: string;

  @ApiPropertyOptional({
    description: 'Indica si la clase está activa para recibir reservas',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
