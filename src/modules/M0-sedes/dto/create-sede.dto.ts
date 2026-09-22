import {
  IsInt,
  IsString,
  IsNotEmpty,
  MaxLength,
  IsPositive,
} from 'class-validator';

export class CreateSedeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  direccion!: string;

  @IsInt()
  @IsPositive()
  aforo_maximo!: number;

  @IsInt()
  @IsPositive()
  id_ciudad!: number;
}
