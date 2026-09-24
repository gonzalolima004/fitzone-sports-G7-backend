import { Injectable } from '@nestjs/common';
import { PrecioStrategy } from './precio-strategy.interface';
import {
  CotizacionContext,
  ResultadoPrecio,
} from '../../dto/cotizacion-turno.dto';

@Injectable()
export class PrecioEstandarStrategy implements PrecioStrategy {
  calcular(costoBase: number, _context: CotizacionContext): ResultadoPrecio {
    // Retorna el precio base sin modificaciones (para usuarios externos o morosos)
    return {
      precio_congelado: costoBase,
      descuento_porcentaje: 0,
      es_horario_pico: false,
    };
  }
}
