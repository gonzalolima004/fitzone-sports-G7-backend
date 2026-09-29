import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class ConsultaDisponibilidadQueryDto {
  @ApiProperty({
    example: '2026-10-15',
    description: 'Fecha para consultar disponibilidad (YYYY-MM-DD)',
  })
  @IsDateString()
  @IsNotEmpty()
  fecha: string;
}
