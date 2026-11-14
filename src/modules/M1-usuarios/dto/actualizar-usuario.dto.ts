import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateUsuarioDto } from './crear-usuario.dto';

export class ActualizarUsuarioDto extends PartialType(
  OmitType(CreateUsuarioDto, [
    'dni',
    'email',
    'roles',
    'contrasenia',
  ] as const),
) {}
