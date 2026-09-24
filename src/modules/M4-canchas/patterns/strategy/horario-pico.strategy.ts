import { Injectable } from '@nestjs/common';
import { PrecioStrategy } from './precio-strategy.interface';
import {
  CotizacionContext,
  ResultadoPrecio,
} from '../../dto/cotizacion-turno.dto';

@Injectable()
export class HorarioPicoStrategy implements PrecioStrategy {
  calcular(costoBase: number, _context: CotizacionContext): ResultadoPrecio {
    const RECARGO = 20; // 20% de recargo en horario pico (19:00 a 21:00)
    const montoRecargo = costoBase * (RECARGO / 100);

    return {
      precio_congelado: costoBase + montoRecargo,
      descuento_porcentaje: 0,
      es_horario_pico: true,
    };
  }
}
