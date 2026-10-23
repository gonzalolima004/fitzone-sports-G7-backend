import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CrearTipoCanchaDto } from './crear-tipo-cancha.dto';

export class ActualizarTipoCanchaDto extends PartialType(CrearTipoCanchaDto) {
  @ApiPropertyOptional({
    example: true,
    description:
      'Indica si el tipo de cancha está activo (permite reactivar o dar de baja)',
  })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
