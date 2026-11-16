import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export enum TipoActividadHistorial {
  TODAS = 'todas',
  CANCHAS = 'canchas',
  CLASES = 'clases',
}

export class HistorialQueryDto {
  @ApiPropertyOptional({
    description: 'Número de página para paginación (inicia en 1)',
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página mínima es 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Cantidad de elementos por página',
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite mínimo es 1' })
  @Max(50, { message: 'El límite máximo permitido es 50' })
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de actividad',
    enum: TipoActividadHistorial,
    default: TipoActividadHistorial.TODAS,
    example: TipoActividadHistorial.TODAS,
  })
  @IsOptional()
  @IsEnum(TipoActividadHistorial, {
    message: 'El tipo debe ser uno de: todas, canchas, clases',
  })
  tipo?: TipoActividadHistorial = TipoActividadHistorial.TODAS;
}
