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

type ConteosDeOcupacion = Omit<
  MetricaOcupacionAgrupadaPorSede,
  'id_sede' | 'nombre_sede'
>;

/** Estado de reserva que cuenta para la ocupación (se compara sin mayúsculas). */
const ESTADO_RESERVA_CONFIRMADA = 'confirmada';

const sinConteos = (): ConteosDeOcupacion => ({
  total_asistencias: 0,
  total_reservas_canchas: 0,
  total_reservas_clases: 0,
});

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

  /**
   * Asistencias y reservas confirmadas de canchas y clases dentro de
   * [fechaDesde, fechaHastaExclusiva), por sede. Solo devuelve sedes con
   * actividad en el período; las métricas sin datos valen 0.
   *
   * Los conteos se hacen en la base con groupBy: asistencias por id_sede
   * (registro_accesos tiene la sede) y reservas por id_cancha / id_clase,
   * que luego se traducen a su sede. Ver ADR-018.
   */
  async obtenerMetricasOcupacionPorSede(
    fechaDesde: Date,
    fechaHastaExclusiva: Date,
    idSede?: number,
  ): Promise<MetricaOcupacionAgrupadaPorSede[]> {
    const rango = { gte: fechaDesde, lt: fechaHastaExclusiva };
    const estadoConfirmada = {
      descripcion: {
        equals: ESTADO_RESERVA_CONFIRMADA,
        mode: Prisma.QueryMode.insensitive,
      },
    };
    const filtrarPorSede = idSede !== undefined;

    const [asistencias, reservasCanchas, reservasClases] = await Promise.all([
      this.prismaService.registroAcceso.groupBy({
        by: ['id_sede'],
        where: {
          fecha_ingreso: rango,
          ...(filtrarPorSede ? { id_sede: idSede } : {}),
        },
        _count: { _all: true },
      }),
      this.prismaService.canchaReserva.groupBy({
        by: ['id_cancha'],
        where: {
          fecha_inicio: rango,
          cancha_reserva_estado: estadoConfirmada,
          ...(filtrarPorSede ? { cancha: { id_sede: idSede } } : {}),
        },
        _count: { _all: true },
      }),
      this.prismaService.claseReserva.groupBy({
        by: ['id_clase'],
        where: {
          fecha_inicio: rango,
          clase_reserva_estado: estadoConfirmada,
          ...(filtrarPorSede ? { clase: { id_sede: idSede } } : {}),
        },
        _count: { _all: true },
      }),
    ]);

    const [sedeDeCancha, sedeDeClase] = await Promise.all([
      this.obtenerSedesDeCanchas(reservasCanchas.map((r) => r.id_cancha)),
      this.obtenerSedesDeClases(reservasClases.map((r) => r.id_clase)),
    ]);

    const conteosPorSede = new Map<number, ConteosDeOcupacion>();
    const sumar = (
      idSedeDelConteo: number | undefined,
      metrica: keyof ConteosDeOcupacion,
      cantidad: number,
    ): void => {
      if (idSedeDelConteo === undefined) {
        return;
      }
      const conteos = conteosPorSede.get(idSedeDelConteo) ?? sinConteos();
      conteos[metrica] += cantidad;
      conteosPorSede.set(idSedeDelConteo, conteos);
    };

    for (const fila of asistencias) {
      sumar(fila.id_sede, 'total_asistencias', fila._count._all);
    }
    for (const fila of reservasCanchas) {
      sumar(
        sedeDeCancha.get(fila.id_cancha),
        'total_reservas_canchas',
        fila._count._all,
      );
    }
    for (const fila of reservasClases) {
      sumar(
        sedeDeClase.get(fila.id_clase),
        'total_reservas_clases',
        fila._count._all,
      );
    }

    if (conteosPorSede.size === 0) {
      return [];
    }

    const sedes = await this.prismaService.sede.findMany({
      where: { id_sede: { in: [...conteosPorSede.keys()] } },
      select: { id_sede: true, nombre: true },
      orderBy: { id_sede: 'asc' },
    });

    return sedes.map((sede) => ({
      id_sede: sede.id_sede,
      nombre_sede: sede.nombre,
      ...(conteosPorSede.get(sede.id_sede) ?? sinConteos()),
    }));
  }

  /** id_cancha → id_sede de las canchas indicadas. */
  private async obtenerSedesDeCanchas(
    idsCanchas: number[],
  ): Promise<Map<number, number>> {
    if (idsCanchas.length === 0) {
      return new Map();
    }
    const canchas = await this.prismaService.cancha.findMany({
      where: { id_cancha: { in: idsCanchas } },
      select: { id_cancha: true, id_sede: true },
    });
    return new Map(canchas.map((cancha) => [cancha.id_cancha, cancha.id_sede]));
  }

  /** id_clase → id_sede de las clases indicadas. */
  private async obtenerSedesDeClases(
    idsClases: number[],
  ): Promise<Map<number, number>> {
    if (idsClases.length === 0) {
      return new Map();
    }
    const clases = await this.prismaService.clase.findMany({
      where: { id_clase: { in: idsClases } },
      select: { id_clase: true, id_sede: true },
    });
    return new Map(clases.map((clase) => [clase.id_clase, clase.id_sede]));
  }
}
