import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class DashboardQueryDto {
  @ApiPropertyOptional({
    description: 'Filtrar el dashboard por ID de sede',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El ID de sede debe ser un número entero' })
  @Min(1, { message: 'El ID de sede mínimo es 1' })
  id_sede?: number;
}
