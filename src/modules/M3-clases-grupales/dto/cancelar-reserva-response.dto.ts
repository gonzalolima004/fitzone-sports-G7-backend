import { ApiProperty } from '@nestjs/swagger';
import { ReservaClaseResponseDto } from './reserva-clase-response.dto';

export class CancelarReservaResponseDto {
  @ApiProperty({
    description:
      'Indica si se aplicó una penalidad por cancelar fuera de término (menos de 2 horas antes de la clase)',
    example: false,
  })
  penalidadAplicada: boolean;

  @ApiProperty({
    description: 'Mensaje descriptivo sobre el resultado de la cancelación',
    example: 'Reserva cancelada exitosamente sin penalidad.',
  })
  mensaje: string;

  @ApiProperty({
    description: 'Datos actualizados de la reserva que fue cancelada',
    type: ReservaClaseResponseDto,
  })
  reserva: ReservaClaseResponseDto;
}
