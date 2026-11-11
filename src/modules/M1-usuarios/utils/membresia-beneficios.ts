import { Prisma } from '@prisma/client';

/**
 * Filtro de una membresía suspendida por el socio: estado 'Suspendida'
 * con al menos un pago aprobado. (Una 'Suspendida' sin pago aprobado es solo
 * una intención de checkout y no otorga beneficios.)
 */
export const WHERE_SUSPENDIDA_CON_PAGO = {
  membresia_estado: {
    descripcion: { equals: 'Suspendida', mode: 'insensitive' as const },
  },
  pagos: {
    some: {
      pago_estado: {
        descripcion: { equals: 'Aprobado', mode: 'insensitive' as const },
      },
    },
  },
};

/**
 * Filtro de membresías que otorgan beneficios de socio a una fecha dada:
 * 'Activa' vigente o 'Suspendida' por el socio (con pago aprobado) cuyo ciclo
 * abonado todavía no venció.
 */
export function whereBeneficiosVigentes(
  id_usuario: number,
  hoy: Date = new Date(),
): Prisma.MembresiaWhereInput {
  return {
    id_usuario,
    fecha_fin: { gte: hoy },
    OR: [
      {
        membresia_estado: {
          descripcion: { equals: 'Activa', mode: 'insensitive' },
        },
      },
      WHERE_SUSPENDIDA_CON_PAGO,
    ],
  };
}
