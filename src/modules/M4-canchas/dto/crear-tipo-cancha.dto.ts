import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CrearTipoCanchaDto {
  @ApiProperty({
    example: 'Pádel',
    description: 'Nombre o descripción de la disciplina o tipo de cancha',
  })
  @IsString()
  @IsNotEmpty()
  descripcion: string;
}
