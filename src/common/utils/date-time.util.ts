/**
 * Utilidades para manejo homogéneo de fechas y huso horario de Argentina (UTC-03:00).
 */

export const TIMEZONE_ARGENTINA_OFFSET = '-03:00';

/**
 * Normaliza una cadena de horario a formato estricto 'HH:mm'.
 * Ejemplos: '18:00:00' -> '18:00', '9:5' -> '09:05'.
 */
export function normalizarHorarioHHmm(
  horario?: string | null,
  defecto = '09:00',
): string {
  if (!horario || typeof horario !== 'string') {
    return defecto;
  }
  const partes = horario.trim().split(':');
  if (partes.length >= 2) {
    const horas = partes[0].padStart(2, '0');
    const minutos = partes[1].padStart(2, '0');
    return `${horas}:${minutos}`;
  }
  return defecto;
}

/**
 * Obtiene la fecha actual en Argentina en formato 'YYYY-MM-DD'.
 */
export function obtenerFechaHoyArgentina(
  referencia: Date = new Date(),
): string {
  // Desplazamiento fijo de Argentina (-3 horas)
  const utcTime = referencia.getTime() + referencia.getTimezoneOffset() * 60000;
  const fechaArt = new Date(utcTime - 3 * 3600000);
  return fechaArt.toISOString().slice(0, 10);
}

/**
 * Construye un objeto Date en el huso horario oficial de Argentina (UTC-03:00)
 * a partir de una fecha 'YYYY-MM-DD' y un horario 'HH:mm'.
 */
export function crearFechaArgentina(
  fechaStr: string,
  horarioStr: string,
): Date {
  const horaNormalizada = normalizarHorarioHHmm(horarioStr);
  return new Date(
    `${fechaStr}T${horaNormalizada}:00.000${TIMEZONE_ARGENTINA_OFFSET}`,
  );
}

/**
 * Retorna los límites de inicio y fin del día en zona horaria Argentina (UTC-03:00).
 */
export function obtenerRangoDiaArgentina(fechaStr: string): {
  inicioDia: Date;
  finDia: Date;
} {
  const inicioDia = new Date(
    `${fechaStr}T00:00:00.000${TIMEZONE_ARGENTINA_OFFSET}`,
  );
  const finDia = new Date(
    `${fechaStr}T23:59:59.999${TIMEZONE_ARGENTINA_OFFSET}`,
  );
  return { inicioDia, finDia };
}

/**
 * Obtiene el día de la semana correspondiente a una fecha 'YYYY-MM-DD'
 * (0 = Domingo, 1 = Lunes, 2 = Martes, 3 = Miércoles, 4 = Jueves, 5 = Viernes, 6 = Sábado).
 */
export function obtenerDiaSemana(fechaStr: string): number {
  const [year, month, day] = fechaStr.slice(0, 10).split('-').map(Number);
  const fechaUtc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return fechaUtc.getUTCDay();
}

/**
 * Determina si una clase debe dictarse en una fecha específica dada (YYYY-MM-DD).
 * - Si tiene 'fecha' puntual asignada, verifica coincidencia exacta.
 * - Si tiene 'dias_semana' definidos, verifica si el día de la semana coincide.
 * - Si no posee restricciones de días ni fecha puntual (registro legacy), retorna true.
 */
export function claseAplicaEnFecha(
  clase: { dias_semana?: number[] | null; fecha?: Date | string | null },
  fechaStr: string,
): boolean {
  const fechaLimpia = fechaStr.slice(0, 10);

  // 1. Si la clase tiene una fecha puntual asignada
  if (clase.fecha) {
    const claseFechaStr =
      clase.fecha instanceof Date
        ? clase.fecha.toISOString().slice(0, 10)
        : String(clase.fecha).slice(0, 10);

    if (!clase.dias_semana || clase.dias_semana.length === 0) {
      return claseFechaStr === fechaLimpia;
    }

    if (claseFechaStr === fechaLimpia) {
      return true;
    }
  }

  // 2. Si la clase tiene definidos días de la semana (0 = Domingo, ..., 6 = Sábado)
  if (Array.isArray(clase.dias_semana) && clase.dias_semana.length > 0) {
    const diaSemana = obtenerDiaSemana(fechaLimpia);
    return clase.dias_semana.includes(diaSemana);
  }

  // 3. Registro legacy sin restricción horaria semanal ni fecha puntual
  return true;
}
