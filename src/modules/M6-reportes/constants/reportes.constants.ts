/**
 * Estados que cuentan en los reportes. Como en el resto de los módulos, se
 * identifican por su descripción y nunca por un ID numérico; las consultas
 * los comparan sin distinguir mayúsculas.
 */
export const ESTADOS_QUE_CUENTAN = {
  /** Pagos que suman en el reporte de ingresos. */
  PAGO: 'Aprobado',
  /** Reservas de canchas y de clases que suman en el reporte de ocupación. */
  RESERVA: 'Confirmada',
} as const;
