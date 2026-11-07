import { BadRequestException } from '@nestjs/common';

/** Fecha en formato YYYY-MM-DD. */
export const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** Hora en formato HH:mm, de 00:00 a 23:59. */
export const FORMATO_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Convierte "YYYY-MM-DD" en la fecha a las 00:00 UTC, que es como se guardan
 * las columnas @db.Date. Rechaza fechas que no existen, como 2026-02-30.
 */
export function aFechaUtc(fecha: string): Date {
  const resultado = new Date(`${fecha}T00:00:00.000Z`);
  if (
    Number.isNaN(resultado.getTime()) ||
    resultado.toISOString().slice(0, 10) !== fecha
  ) {
    throw new BadRequestException(`La fecha ${fecha} no existe.`);
  }
  return resultado;
}

/** Fecha de una columna @db.Date en formato YYYY-MM-DD. */
export function aTextoFecha(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

/** Exige que la apertura sea anterior al cierre (ambas en formato HH:mm). */
export function validarRangoHorario(apertura: string, cierre: string): void {
  if (apertura >= cierre) {
    throw new BadRequestException(
      'La hora de apertura debe ser anterior a la hora de cierre.',
    );
  }
}

/**
 * True si el cuerpo de una modificación no trae ningún campo. Los DTO tienen
 * sus campos declarados, así que se miran los valores y no las claves.
 */
export function sinCambios(dto: object): boolean {
  return Object.values(dto).every((valor) => valor === undefined);
}

/**
 * Valida un rango de fechas opcional y lo convierte a fechas UTC para filtrar.
 */
export function convertirRango(filtros: { desde?: string; hasta?: string }): {
  desde?: Date;
  hasta?: Date;
} {
  const desde = filtros.desde ? aFechaUtc(filtros.desde) : undefined;
  const hasta = filtros.hasta ? aFechaUtc(filtros.hasta) : undefined;
  if (desde && hasta && desde > hasta) {
    throw new BadRequestException(
      'La fecha desde no puede ser posterior a la fecha hasta.',
    );
  }
  return { desde, hasta };
}
