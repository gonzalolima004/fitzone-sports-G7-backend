import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
} from 'class-validator';

export class CrearReservaCanchaDto {
  @ApiProperty({ example: 1, description: 'ID de la cancha a reservar' })
  @IsNumber()
  @IsPositive()
  id_cancha: number;

  @ApiProperty({
    example: '2026-10-15T10:00:00Z',
    description: 'Fecha y hora de inicio',
  })
  @IsDateString()
  @IsNotEmpty()
  fecha_inicio: string;

  @ApiProperty({
    example: '2026-10-15T11:00:00Z',
    description: 'Fecha y hora de fin',
  })
  @IsDateString()
  @IsNotEmpty()
  fecha_fin: string;
}
