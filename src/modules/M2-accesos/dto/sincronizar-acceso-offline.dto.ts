import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsDate,
  IsString,
  IsIn,
} from 'class-validator';

export class SincronizarAccesoOfflineDto {
  @ApiProperty({
    description: 'ID del usuario socio extraído del QR',
    example: 25,
  })
  @Type(() => Number)
  @IsInt({ message: 'El id_usuario debe ser un número entero' })
  @IsPositive({ message: 'El id_usuario debe ser mayor a 0' })
  @IsNotEmpty({ message: 'El id_usuario es obligatorio' })
  id_usuario: number;

  @ApiProperty({
    description: 'ID de la sede donde ocurrió el acceso',
    example: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'El id_sede debe ser un número entero' })
  @IsPositive({ message: 'El id_sede debe ser mayor a 0' })
  @IsNotEmpty({ message: 'El id_sede es obligatorio' })
  id_sede: number;

  @ApiProperty({ description: 'Tipo de operación offline', example: 'INGRESO' })
  @IsString()
  @IsIn(['INGRESO', 'EGRESO'], { message: 'El tipo debe ser INGRESO o EGRESO' })
  @IsNotEmpty({ message: 'El tipo de operación es obligatorio' })
  tipo: 'INGRESO' | 'EGRESO';

  @ApiProperty({
    description: 'Marca de tiempo histórica en que ocurrió el evento offline',
    example: '2026-11-09T00:24:30.249Z',
  })
  @Type(() => Date)
  @IsDate({ message: 'La fecha debe ser un objeto Date válido' })
  @IsNotEmpty({ message: 'La marca de tiempo es obligatoria' })
  timestamp: Date;
}
