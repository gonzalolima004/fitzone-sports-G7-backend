import { PartialType } from '@nestjs/swagger';
import { CreateCalendarioDto } from './create-calendario.dto';

export class UpdateCalendarioDto extends PartialType(CreateCalendarioDto) {}
