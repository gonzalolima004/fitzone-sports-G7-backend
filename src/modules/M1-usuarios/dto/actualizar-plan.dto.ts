import { PartialType } from '@nestjs/swagger';
import { CrearPlanDto } from './crear-plan.dto';

export class ActualizarPlanDto extends PartialType(CrearPlanDto) {}
