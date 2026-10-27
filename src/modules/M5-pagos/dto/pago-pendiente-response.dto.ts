import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TipoConceptoPago } from './pago-detalle-response.dto';

/**
 * Concepto que el usuario autenticado tiene pendiente de abonar
 * (reserva de cancha sin pago aprobado o cuota de membresía vencida).
 */
export class PagoPendienteResponseDto {
  @ApiProperty({
    description: 'Tipo de concepto pendiente de pago',
    enum: ['cancha', 'membresia'],
    example: 'cancha',
  })
  tipo: Exclude<TipoConceptoPago, 'general'>;

  @ApiProperty({
    description:
      'Identificador del recurso a abonar (id_cancha_reserva o id_membresia)',
    example: 4,
  })
  id_referencia: number;

  @ApiProperty({
    description: 'Denominación sintética del concepto a abonar',
    example: 'Reserva Cancha Pádel 1',
  })
  titulo: string;

  @ApiProperty({
    description: 'Detalle contextual (sede, horario o vigencia)',
    example: 'Sede Central - Horario: 26/09/2026 18:00 a 19:00 hs',
  })
  detalle: string;

  @ApiProperty({
    description: 'Monto a abonar en Pesos Argentinos (ARS)',
    example: 15000,
  })
  monto: number;

  @ApiPropertyOptional({
    description: 'Duración en días del plan en caso de membresía',
    example: 30,
  })
  duracion_dias?: number;
}
