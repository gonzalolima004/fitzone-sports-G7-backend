import { ApiProperty } from '@nestjs/swagger';

export enum SlotEstado {
  DISPONIBLE = 'DISPONIBLE',
  RESERVADO = 'RESERVADO',
  MANTENIMIENTO = 'MANTENIMIENTO',
}

export class DisponibilidadSlotResponseDto {
  @ApiProperty({ example: '08:00' })
  horaInicio: string;

  @ApiProperty({ example: '09:00' })
  horaFin: string;

  @ApiProperty({ enum: SlotEstado, example: SlotEstado.DISPONIBLE })
  estado: SlotEstado;
}
