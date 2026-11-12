/**
 * Valores de negocio de M0-sedes en un solo lugar. Los horarios salen siempre
 * de la base (sede_horario y calendario_sede): no hay horarios por defecto.
 */

/** Roles con cuenta en FitZone: pueden ver el detalle y el horario de una sede. */
export const ROLES_CON_CUENTA = [
  'socio',
  'externo',
  'recepcionista',
  'gerente',
];

/** Las columnas de hora no admiten nulos: un día sin atención guarda 00:00. */
export const SIN_ATENCION = '00:00';

/** Motivos que informa el horario operativo cuando la sede no abre. */
export const MOTIVOS_DE_CIERRE = {
  /** Cierre del calendario sin motivo ni descripción de la fecha. */
  CALENDARIO: 'Sede cerrada por feriado / calendario oficial',
  /** El horario semanal marca ese día como cerrado. */
  DIA_SIN_ATENCION: 'La sede no abre este día',
  /** La sede todavía no tiene horario cargado para ese día de la semana. */
  SIN_HORARIO: 'La sede no tiene horario cargado para este día',
} as const;
