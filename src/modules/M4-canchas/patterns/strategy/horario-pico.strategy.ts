import { Injectable } from '@nestjs/common';
import { PrecioStrategy } from './precio-strategy.interface';
import {
  CotizacionContext,
  ResultadoPrecio,
} from '../../dto/cotizacion-turno.dto';
import { REGLAS_CANCHAS } from '../../constants/canchas.constants';

@Injectable()
export class HorarioPicoStrategy implements PrecioStrategy {
  calcular(costoBase: number, _context: CotizacionContext): ResultadoPrecio {
    const RECARGO = REGLAS_CANCHAS.PORCENTAJE_RECARGO_PICO;
    const montoRecargo = costoBase * (RECARGO / 100);

    return {
      precio_congelado: costoBase + montoRecargo,
      descuento_porcentaje: 0,
      es_horario_pico: true,
    };
  }
}
