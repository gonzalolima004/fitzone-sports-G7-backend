import { ApiProperty } from '@nestjs/swagger';

export class CotizacionContext {
  @ApiProperty({
    description:
      'Indica si el usuario tiene una membresía activa y al día (RN-03)',
  })
  esSocioActivo: boolean;

  @ApiProperty({
    description: 'Hora de inicio de la reserva para evaluar si es horario pico',
  })
  horaInicio: Date;
}

export class ResultadoPrecio {
  @ApiProperty({
    description: 'Precio final calculado que se congelará en la reserva',
  })
  precio_congelado: number;

  @ApiProperty({
    description: 'Porcentaje de descuento aplicado (0 si no aplica)',
  })
  descuento_porcentaje: number;

  @ApiProperty({
    description: 'Indica si se aplicó un recargo por horario pico',
  })
  es_horario_pico: boolean;
}
