import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CrearPlanDto {
  @ApiProperty({
    example: 'Plan Mensual',
    description: 'Nombre comercial del plan de membresía',
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del plan no puede estar vacío' })
  @Transform(({ value }: { value: unknown }) => capitalizarPalabras(value))
  nombre: string;
  @ApiProperty({ example: 30, description: 'Duración de la membresía en días' })
  @IsNotEmpty({ message: 'La duración en días es obligatoria' })
  @IsNumber({}, { message: 'La duración en días debe ser un número entero' })
  @Min(1, { message: 'La duración debe ser de al menos 1 día' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? Number(value) : value,
  )
  duracion_dias: number;
  @ApiProperty({
    example: 25000.0,
    description: 'Precio base del plan de membresía',
  })
  @IsNotEmpty({ message: 'El precio del plan no puede estar vacío' })
  @IsNumber({}, { message: 'El precio debe ser un número válido' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? Number(value) : value,
  )
  precio: number;
}
const capitalizarPalabras = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  return value
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};
