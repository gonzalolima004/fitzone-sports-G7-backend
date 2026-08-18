/**
 * ARCHIVO: create-usuario.dto.ts
 * PROPÓSITO: Data Transfer Object (DTO) para la creación.
 * Define la estructura y validaciones de los datos que se esperan recibir
 * al momento de crear un nuevo usuario.
 */
import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';

export class CreateUsuarioDto {
  // EJEMPLO: Requerimos que el nombre sea un texto y no esté vacío
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  nombre: string;

  // EJEMPLO: Validamos que el email tenga el formato correcto (ej: juan@gmail.com)
  @IsEmail({}, { message: 'El formato del email es inválido' })
  email: string;

  // EJEMPLO: La contraseña debe ser texto y tener al menos 6 caracteres
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}
