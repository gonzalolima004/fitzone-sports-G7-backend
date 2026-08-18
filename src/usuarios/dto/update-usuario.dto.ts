/**
 * ARCHIVO: update-usuario.dto.ts
 * PROPÓSITO: Data Transfer Object (DTO) para la actualización.
 * Hereda de CreateUsuarioDto usando PartialType, lo que hace que todos 
 * los campos originales sean opcionales.
 */
import { PartialType } from '@nestjs/mapped-types';
import { CreateUsuarioDto } from './create-usuario.dto';

// EJEMPLO: PartialType toma todo lo que definimos en CreateUsuarioDto (nombre, email, password)
// y lo hace opcional. Es decir, para actualizar podemos enviar solo el nombre, o solo el email.
export class UpdateUsuarioDto extends PartialType(CreateUsuarioDto) {}
