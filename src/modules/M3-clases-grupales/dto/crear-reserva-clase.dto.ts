import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNotEmpty } from 'class-validator';

export class CrearReservaClaseDto {
  @ApiProperty({ description: 'ID de la clase a reservar', example: 1 })
  @IsInt()
  @IsNotEmpty()
  id_clase: number;

  @ApiProperty({
    description: 'Fecha y hora de inicio de la reserva',
    example: '2026-09-22T10:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  fecha_inicio: string;

  @ApiProperty({
    description: 'Fecha y hora de fin de la reserva',
    example: '2026-09-22T11:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  fecha_fin: string;
}
