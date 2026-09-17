import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsNumber,
} from 'class-validator';

export class CreateUsuarioDto {
  @IsString()
  @IsNotEmpty()
  dni: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail({}, { message: 'El email es inválido' })
  email: string;

  @IsString()
  @IsNotEmpty()
  //@MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' }) no va por ahora
  //@MaxLength(16, { message: 'La contraseña debe tener menos de 16 caracteres' }) no va por ahora
  contrasenia: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  apellido: string;

  @IsString()
  @IsNotEmpty()
  //@IsPhoneNumber("AR", { message: 'El teléfono debe ser un número de teléfono válido' }) no va por ahora
  telefono: string;

  @IsString()
  @IsNotEmpty()
  foto_url: string;

  @IsNotEmpty()
  @IsString()
  id_sede: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  roles?: number[];

  //Falta la parte del transform
}
