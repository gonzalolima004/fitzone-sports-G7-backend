import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma-service/prisma.service';

export type IngresoAgrupadoPorSede = {
  id_sede: number;
  nombre_sede: string;
  total_ingresos: Prisma.Decimal;
};

export type MetricaOcupacionAgrupadaPorSede = {
  id_sede: number;
  nombre_sede: string;
  total_asistencias: number;
  total_reservas_canchas: number;
  total_reservas_clases: number;
};

type SedeDelPago = { id_sede: number; nombre: string };

@Injectable()
export class ReportesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Ingresos de pagos en el estado indicado dentro de
   * [fechaDesde, fechaHastaExclusiva), agrupados por sede.
   *
   * Un pago llega a una sede por dos caminos: membresía → usuario → sede y
   * reserva de cancha → cancha → sede. Prisma no agrupa por campos de tablas
   * relacionadas, así que se consultan los pagos con sus relaciones (solo los
   * campos necesarios) y se suman por sede en memoria con Prisma.Decimal para
   * no perder precisión. Ver ADR-018.
   */
  async obtenerIngresosPorSede(
    fechaDesde: Date,
    fechaHastaExclusiva: Date,
    estadoPagoValido: string,
    idSede?: number,
    concepto?: 'cancha' | 'membresia',
  ): Promise<IngresoAgrupadoPorSede[]> {
    const incluirMembresias = concepto !== 'cancha';
    const incluirCanchas = concepto !== 'membresia';

    const caminos: Prisma.PagoWhereInput[] = [];
    if (incluirMembresias) {
      caminos.push(
        idSede === undefined
          ? { id_membresia: { not: null } }
          : { membresia: { is: { usuario: { is: { id_sede: idSede } } } } },
      );
    }
    if (incluirCanchas) {
      caminos.push(
        idSede === undefined
          ? { id_cancha_reserva: { not: null } }
          : { cancha_reserva: { is: { cancha: { is: { id_sede: idSede } } } } },
      );
    }

    const pagos = await this.prismaService.pago.findMany({
      where: {
        fecha_pago: { gte: fechaDesde, lt: fechaHastaExclusiva },
        pago_estado: {
          descripcion: {
            equals: estadoPagoValido,
            mode: Prisma.QueryMode.insensitive,
          },
        },
        OR: caminos,
      },
      select: {
        monto: true,
        membresia: {
          select: {
            usuario: {
              select: { sede: { select: { id_sede: true, nombre: true } } },
            },
          },
        },
        cancha_reserva: {
          select: {
            cancha: {
              select: { sede: { select: { id_sede: true, nombre: true } } },
            },
          },
        },
      },
    });

    const totalesPorSede = new Map<number, IngresoAgrupadoPorSede>();
    const acumular = (
      sede: SedeDelPago | undefined,
      monto: Prisma.Decimal,
    ): void => {
      if (!sede || (idSede !== undefined && sede.id_sede !== idSede)) {
        return;
      }
      const acumulado = totalesPorSede.get(sede.id_sede);
      totalesPorSede.set(sede.id_sede, {
        id_sede: sede.id_sede,
        nombre_sede: sede.nombre,
        total_ingresos: acumulado
          ? acumulado.total_ingresos.add(monto)
          : new Prisma.Decimal(monto),
      });
    };

    for (const pago of pagos) {
      if (incluirMembresias) {
        acumular(pago.membresia?.usuario.sede, pago.monto);
      }
      if (incluirCanchas) {
        acumular(pago.cancha_reserva?.cancha.sede, pago.monto);
      }
    }

    return [...totalesPorSede.values()].sort((a, b) => a.id_sede - b.id_sede);
  }

  async obtenerMetricasOcupacionPorSede(
    fechaDesde: Date,
    fechaHastaExclusiva: Date,
    idSede?: number,
  ): Promise<MetricaOcupacionAgrupadaPorSede[]> {
    const filtroSede = idSede
      ? Prisma.sql`AND s.id_sede = ${idSede}`
      : Prisma.empty;

    return this.prismaService.$queryRaw<MetricaOcupacionAgrupadaPorSede[]>(
      Prisma.sql`
        WITH asistencias AS (
          SELECT ra.id_sede, COUNT(*)::int AS total_asistencias
          FROM registro_accesos ra
          INNER JOIN sede s ON s.id_sede = ra.id_sede
          WHERE ra.fecha_ingreso >= ${fechaDesde}
            AND ra.fecha_ingreso < ${fechaHastaExclusiva}
            ${filtroSede}
          GROUP BY ra.id_sede
        ),
        reservas_canchas AS (
          SELECT c.id_sede, COUNT(*)::int AS total_reservas_canchas
          FROM cancha_reserva cr
          INNER JOIN cancha c ON c.id_cancha = cr.id_cancha
          INNER JOIN sede s ON s.id_sede = c.id_sede
          INNER JOIN cancha_reserva_estado cre
            ON cre.id_cancha_reserva_estado = cr.id_cancha_reserva_estado
          WHERE cr.fecha_inicio >= ${fechaDesde}
            AND cr.fecha_inicio < ${fechaHastaExclusiva}
            AND LOWER(cre.descripcion) = 'confirmada'
            ${filtroSede}
          GROUP BY c.id_sede
        ),
        reservas_clases AS (
          SELECT c.id_sede, COUNT(*)::int AS total_reservas_clases
          FROM clase_reserva cr
          INNER JOIN clase c ON c.id_clase = cr.id_clase
          INNER JOIN sede s ON s.id_sede = c.id_sede
          INNER JOIN clase_reserva_estado cre
            ON cre.id_clase_reserva_estado = cr.id_clase_reserva_estado
          WHERE cr.fecha_inicio >= ${fechaDesde}
            AND cr.fecha_inicio < ${fechaHastaExclusiva}
            AND LOWER(cre.descripcion) = 'confirmada'
            ${filtroSede}
          GROUP BY c.id_sede
        )
        SELECT
          s.id_sede,
          s.nombre AS nombre_sede,
          COALESCE(a.total_asistencias, 0)::int AS total_asistencias,
          COALESCE(rc.total_reservas_canchas, 0)::int AS total_reservas_canchas,
          COALESCE(rcl.total_reservas_clases, 0)::int AS total_reservas_clases
        FROM sede s
        LEFT JOIN asistencias a ON a.id_sede = s.id_sede
        LEFT JOIN reservas_canchas rc ON rc.id_sede = s.id_sede
        LEFT JOIN reservas_clases rcl ON rcl.id_sede = s.id_sede
        WHERE (a.id_sede IS NOT NULL OR rc.id_sede IS NOT NULL OR rcl.id_sede IS NOT NULL)
          ${filtroSede}
        ORDER BY s.id_sede
      `,
    );
  }
}
