import { PartialType } from '@nestjs/swagger';
import { CreateMembresiaDto } from './crear-membresia.dto';

export class ActualizarMembresiaEstadoDto extends PartialType(
  CreateMembresiaDto,
) {}
