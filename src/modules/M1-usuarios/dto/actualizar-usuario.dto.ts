import { PartialType } from '@nestjs/swagger';
import { CreateUsuarioDto } from './crear-usuario.dto';

export class ActualizarUsuarioDto extends PartialType(CreateUsuarioDto) {}
