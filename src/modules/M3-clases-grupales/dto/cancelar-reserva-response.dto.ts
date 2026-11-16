import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReservaClaseResponseDto } from './reserva-clase-response.dto';

export class CancelarReservaResponseDto {
  @ApiProperty({
    description: 'Mensaje descriptivo sobre el resultado de la cancelación',
    example: 'Reserva cancelada exitosamente.',
  })
  mensaje: string;

  @ApiProperty({
    description: 'Datos actualizados de la reserva que fue cancelada',
    type: ReservaClaseResponseDto,
  })
  reserva: ReservaClaseResponseDto;

  @ApiPropertyOptional({
    description:
      'Indica si el cupo liberado fue reasignado a un socio en lista de espera',
    example: true,
  })
  cupo_reasignado?: boolean;
}
