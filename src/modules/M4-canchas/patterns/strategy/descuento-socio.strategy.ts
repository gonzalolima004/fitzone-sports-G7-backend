import { Injectable } from '@nestjs/common';
import { PrecioStrategy } from './precio-strategy.interface';
import {
  CotizacionContext,
  ResultadoPrecio,
} from '../../dto/cotizacion-turno.dto';
import { REGLAS_CANCHAS } from '../../constants/canchas.constants';

@Injectable()
export class DescuentoSocioStrategy implements PrecioStrategy {
  calcular(costoBase: number, _context: CotizacionContext): ResultadoPrecio {
    const DESCUENTO = REGLAS_CANCHAS.PORCENTAJE_DESCUENTO_SOCIO;
    const montoDescuento = costoBase * (DESCUENTO / 100);

    return {
      precio_congelado: costoBase - montoDescuento,
      descuento_porcentaje: DESCUENTO,
      es_horario_pico: false,
    };
  }
}
