import { addMonths, addDays } from 'date-fns';

/**
 * Mapea la cantidad de días del plan a meses calendario.
 * 30 días -> 1 mes
 * 90 días -> 3 meses
 * 365 días -> 12 meses (1 año)
 */
export function mesesDePlan(duracion_dias: number): number | null {
  if (duracion_dias === 30) return 1;
  if (duracion_dias === 90) return 3;
  if (duracion_dias === 365) return 12;
  return null;
}

/**
 * Calcula la fecha de vencimiento según los meses calendario correspondientes.
 * Si el plan no mapea a meses estándar, hace fallback sumando los días exactos.
 * Maneja automáticamente fines de mes (ej. 31 de enero + 1 mes = 28 o 29 de febrero).
 */
export function calcularFechaFin(inicio: Date, duracion_dias: number): Date {
  const meses = mesesDePlan(duracion_dias);
  if (meses !== null) {
    return addMonths(inicio, meses);
  }
  return addDays(inicio, duracion_dias);
}

/**
 * Retorna la etiqueta legible del plan (ej. 'Plan Mensual').
 */
export function etiquetaPlan(duracion_dias: number): string {
  switch (duracion_dias) {
    case 30:
      return 'Plan Mensual';
    case 90:
      return 'Plan Trimestral';
    case 365:
      return 'Plan Anual';
    default:
      return `Plan de ${duracion_dias} días`;
  }
}

/**
 * Retorna el nombre sintético del período (ej. 'Mensual').
 */
export function nombrePeriodo(duracion_dias: number): string {
  switch (duracion_dias) {
    case 30:
      return 'Mensual';
    case 90:
      return 'Trimestral';
    case 365:
      return 'Anual';
    default:
      return `${duracion_dias} días`;
  }
}
