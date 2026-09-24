import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';

export class InscribirListaEsperaDto {
  @ApiProperty({ description: 'ID de la clase a la cual anotarse en lista de espera', example: 1 })
  @IsInt()
  @IsNotEmpty()
  id_clase: number;

  @ApiProperty({ description: 'Fecha y hora de inicio de la clase' })
  @IsNotEmpty()
  fecha_inicio: Date;

  @ApiProperty({ description: 'Fecha y hora de fin de la clase' })
  @IsNotEmpty()
  fecha_fin: Date;
}
