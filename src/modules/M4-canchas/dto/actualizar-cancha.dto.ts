import { PartialType } from '@nestjs/swagger';
import { CrearCanchaDto } from '../dto/crear-cancha.dto';

// PartialType hace que todos los campos de CrearCanchaDto sean opcionales para el PATCH
export class ActualizarCanchaDto extends PartialType(CrearCanchaDto) {}
