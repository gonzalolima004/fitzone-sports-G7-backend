import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AforoStatusResponseDto {
  @ApiProperty({ example: 1, description: 'ID de la sede' })
  @Type(() => Number)
  @IsInt()
  idSede!: number;

  @ApiProperty({
    example: 45,
    description: 'Cantidad actual de personas en la sede',
  })
  @IsInt()
  @Min(0)
  aforoActual!: number;

  @ApiProperty({
    example: 100,
    description: 'Capacidad máxima permitida de la sede',
  })
  @IsInt()
  @IsPositive()
  aforoMaximo!: number;

  constructor(partial: Partial<AforoStatusResponseDto>) {
    Object.assign(this, partial);
  }
}
