import type { calendario } from '@prisma/client';
import type { CalendarioResponseDto } from '../dto/calendario-response.dto';
import { aTextoFecha } from './calendario.utils';

/** Fila de calendario con la fecha en formato YYYY-MM-DD. */
export function aCalendarioRespuesta(fila: calendario): CalendarioResponseDto {
  return {
    id_calendario: fila.id_calendario,
    fecha: aTextoFecha(fila.fecha),
    descripcion: fila.descripcion,
    es_feriado: fila.es_feriado,
    es_dia_habil: fila.es_dia_habil,
  };
}
