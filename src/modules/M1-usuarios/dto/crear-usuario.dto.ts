import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsNumber,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

const capitalizarPalabras = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;

  return value
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export class CreateUsuarioDto {
  @ApiProperty({ example: '43434343', description: 'DNI del usuario' })
  @IsString()
  @IsNotEmpty({ message: 'El DNI no puede estar vacío' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().replace(/[^0-9kK]/g, '') : value,
  )
  dni: string;

  @ApiProperty({
    example: 'juan.perez@fitzone.com',
    description: 'Correo electrónico del usuario',
  })
  @IsString()
  @IsNotEmpty({ message: 'El correo electrónico no puede estar vacío' })
  @IsEmail({}, { message: 'El email es inválido' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;

  @ApiProperty({
    example: 'Password123',
    description: 'Contraseña del usuario (Opcional si la gestiona Supabase)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @MaxLength(16, { message: 'La contraseña debe tener menos de 16 caracteres' })
  contrasenia?: string;

  @ApiProperty({ example: 'Juan', description: 'Nombre del usuario' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  @Transform(({ value }: { value: unknown }) => capitalizarPalabras(value))
  nombre: string;

  @ApiProperty({ example: 'Perez', description: 'Apellido del usuario' })
  @IsString()
  @IsNotEmpty({ message: 'El apellido no puede estar vacío' })
  @Transform(({ value }: { value: unknown }) => capitalizarPalabras(value))
  apellido: string;

  @ApiProperty({
    example: '+5493454859676',
    description: 'Teléfono del usuario',
  })
  @IsString()
  @IsNotEmpty({ message: 'El teléfono no puede estar vacío' })
  telefono: string;

  @ApiProperty({
    example: 'https://example.com/foto.jpg',
    description: 'URL de la foto del usuario (Opcional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  foto_url?: string;

  @ApiProperty({ example: '1', description: 'ID de la sede del usuario' })
  @IsNotEmpty()
  @IsString()
  id_sede: string;

  @ApiProperty({
    example: [1, 2],
    description: 'IDs de los roles del usuario',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  roles?: number[];
}
