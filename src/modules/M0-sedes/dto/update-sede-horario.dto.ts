import { PartialType } from '@nestjs/swagger';
import { CreateSedeHorarioDto } from './create-sede-horario.dto';

export class UpdateSedeHorarioDto extends PartialType(CreateSedeHorarioDto) {}
