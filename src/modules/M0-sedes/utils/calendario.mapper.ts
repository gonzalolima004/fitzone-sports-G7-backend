import type { calendario, calendario_sede } from '@prisma/client';
import type { CalendarioResponseDto } from '../dto/calendario-response.dto';
import type { CalendarioSedeResponseDto } from '../dto/calendario-sede-response.dto';
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

/** Excepción de una sede junto con su fecha del calendario general. */
export function aExcepcionRespuesta(
  excepcion: calendario_sede,
  dia: calendario,
): CalendarioSedeResponseDto {
  return {
    id_calendario_sede: excepcion.id_calendario_sede,
    id_sede: excepcion.id_sede,
    id_calendario: excepcion.id_calendario,
    fecha: aTextoFecha(dia.fecha),
    cerrado: excepcion.cerrado,
    hora_apertura: excepcion.hora_apertura,
    hora_cierre: excepcion.hora_cierre,
    motivo: excepcion.motivo,
    calendario: aCalendarioRespuesta(dia),
  };
}
