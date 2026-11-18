import { PartialType } from '@nestjs/swagger';
import { CreateCalendarioSedeDto } from './create-calendario-sede.dto';

export class UpdateCalendarioSedeDto extends PartialType(
  CreateCalendarioSedeDto,
) {}
