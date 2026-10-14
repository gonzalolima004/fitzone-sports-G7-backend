import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNotEmpty } from 'class-validator';

export class InscribirListaEsperaDto {
  @ApiProperty({
    description: 'ID de la clase a la cual anotarse en lista de espera',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  id_clase: number;

  @ApiProperty({
    description: 'Fecha y hora de inicio de la clase (formato ISO)',
    example: '2026-10-12T18:30:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  fecha_inicio: string;

  @ApiProperty({
    description: 'Fecha y hora de fin de la clase (formato ISO)',
    example: '2026-10-12T19:30:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  fecha_fin: string;
}
