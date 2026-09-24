import {
  CotizacionContext,
  ResultadoPrecio,
} from '../../dto/cotizacion-turno.dto';

/**
 * PATRÓN STRATEGY (GoF): Interfaz común.
 * En lugar de tener un montón de "if/else" en el servicio principal,
 * cada regla de precio (Estandar, Socio, Pico) implementará esta interfaz.
 * El contexto ejecutará calcular() sin importarle qué estrategia específica es.
 */
export interface PrecioStrategy {
  calcular(costoBase: number, context: CotizacionContext): ResultadoPrecio;
}
