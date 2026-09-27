import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsString,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class CrearMantenimientoDto {
  @ApiProperty({
    example: '2026-10-20T08:00:00Z',
    description: 'Fecha y hora de inicio del mantenimiento',
  })
  @IsDateString()
  @IsNotEmpty()
  fecha_inicio: string;

  @ApiProperty({
    example: '2026-10-20T12:00:00Z',
    description: 'Fecha y hora de fin del mantenimiento',
  })
  @IsDateString()
  @IsNotEmpty()
  fecha_fin: string;

  @ApiPropertyOptional({
    example: 'Reparación de red e iluminación',
    description: 'Motivo del mantenimiento',
  })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  motivo?: string;
}
