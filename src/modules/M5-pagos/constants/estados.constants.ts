/**
 * Descripciones canónicas de los estados usados por M5.
 * Los estados se identifican siempre por su descripción; nunca por un ID numérico.
 */
export const PAGO_ESTADO = {
  PENDIENTE: 'Pendiente',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
} as const;

export const MEMBRESIA_ESTADO = {
  ACTIVA: 'Activa',
  VENCIDA: 'Vencida',
  SUSPENDIDA: 'Suspendida',
} as const;

export const RESERVA_ESTADO = {
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada',
} as const;

/**
 * Compara (sin distinguir mayúsculas) la descripción de un estado con una constante.
 */
export function esEstado(
  estado: { descripcion?: string | null } | null | undefined,
  esperado: string,
): boolean {
  return estado?.descripcion?.trim().toLowerCase() === esperado.toLowerCase();
}
