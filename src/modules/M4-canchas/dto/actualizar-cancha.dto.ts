import { PartialType } from '@nestjs/swagger';
import { CrearCanchaDto } from '../dto/crear-cancha.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

// PartialType hace que todos los campos de CrearCanchaDto sean opcionales para el PATCH
export class ActualizarCanchaDto extends PartialType(CrearCanchaDto) {
  @ApiPropertyOptional({
    example: true,
    description: 'Indica si la cancha está disponible para reservas',
  })
  @IsBoolean()
  @IsOptional()
  disponible?: boolean;
}
