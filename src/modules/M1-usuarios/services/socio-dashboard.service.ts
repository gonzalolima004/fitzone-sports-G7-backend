import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma-service/prisma.service';
import {
  HistorialQueryDto,
  TipoActividadHistorial,
} from '../dto/historial-query.dto';
import {
  HistorialResponseDto,
  ItemHistorialDto,
} from '../dto/historial-response.dto';
import {
  MembresiaResumenDto,
  SocioDashboardResponseDto,
  TotalesActividadesDto,
} from '../dto/socio-dashboard-response.dto';

interface CanchaReservaQueryResult {
  id_cancha_reserva: number;
  fecha_inicio: Date;
  fecha_fin: Date;
  fecha_creacion: Date | null;
  precio_congelado: unknown;
  cancha: {
    nombre: string;
    cancha_tipo: {
      descripcion: string;
    };
    sede: {
      id_sede: number;
      nombre: string;
      direccion: string;
    };
  };
  cancha_reserva_estado: {
    descripcion: string;
  };
}

interface ClaseReservaQueryResult {
  id_clase_reserva: number;
  fecha_inicio: Date;
  fecha_fin: Date;
  fecha_creacion: Date | null;
  clase: {
    nombre: string;
    profesor: string | null;
    sala: string | null;
    sede: {
      id_sede: number;
      nombre: string;
      direccion: string;
    };
  };
  clase_reserva_estado: {
    descripcion: string;
  };
}

@Injectable()
export class SocioDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene el historial unificado y paginado de reservas del socio.
   */
  async obtenerHistorial(
    id_usuario: number,
    query: HistorialQueryDto,
  ): Promise<HistorialResponseDto> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, Math.min(50, query.limit ?? 10));
    const tipo = query.tipo ?? TipoActividadHistorial.TODAS;
    const id_sede = query.id_sede;

    const items: ItemHistorialDto[] = [];

    // 1. Consultar reservas de canchas si aplica
    if (
      tipo === TipoActividadHistorial.TODAS ||
      tipo === TipoActividadHistorial.CANCHAS
    ) {
      const canchasReservas: CanchaReservaQueryResult[] =
        await this.prisma.canchaReserva.findMany({
          where: {
            id_usuario,
            ...(id_sede ? { cancha: { id_sede } } : {}),
          },
          select: {
            id_cancha_reserva: true,
            fecha_inicio: true,
            fecha_fin: true,
            fecha_creacion: true,
            precio_congelado: true,
            cancha: {
              select: {
                nombre: true,
                cancha_tipo: {
                  select: { descripcion: true },
                },
                sede: {
                  select: {
                    id_sede: true,
                    nombre: true,
                    direccion: true,
                  },
                },
              },
            },
            cancha_reserva_estado: {
              select: { descripcion: true },
            },
          },
        });

      for (const r of canchasReservas) {
        items.push({
          id: `cancha-${r.id_cancha_reserva}`,
          tipo: 'cancha',
          titulo: r.cancha.nombre,
          subtitulo: r.cancha.cancha_tipo.descripcion,
          fecha_inicio: r.fecha_inicio.toISOString(),
          fecha_fin: r.fecha_fin.toISOString(),
          fecha_creacion: r.fecha_creacion
            ? r.fecha_creacion.toISOString()
            : null,
          estado: r.cancha_reserva_estado.descripcion,
          sede: {
            id_sede: r.cancha.sede.id_sede,
            nombre: r.cancha.sede.nombre,
            direccion: r.cancha.sede.direccion,
          },
          precio:
            r.precio_congelado != null ? Number(r.precio_congelado) : undefined,
        });
      }
    }

    // 2. Consultar inscripciones a clases si aplica
    if (
      tipo === TipoActividadHistorial.TODAS ||
      tipo === TipoActividadHistorial.CLASES
    ) {
      const clasesReservas: ClaseReservaQueryResult[] =
        await this.prisma.claseReserva.findMany({
          where: {
            id_usuario,
            ...(id_sede ? { clase: { id_sede } } : {}),
          },
          select: {
            id_clase_reserva: true,
            fecha_inicio: true,
            fecha_fin: true,
            fecha_creacion: true,
            clase: {
              select: {
                nombre: true,
                profesor: true,
                sala: true,
                sede: {
                  select: {
                    id_sede: true,
                    nombre: true,
                    direccion: true,
                  },
                },
              },
            },
            clase_reserva_estado: {
              select: { descripcion: true },
            },
          },
        });

      for (const c of clasesReservas) {
        const subtituloPartes = [c.clase.profesor, c.clase.sala]
          .filter(Boolean)
          .join(' - ');

        items.push({
          id: `clase-${c.id_clase_reserva}`,
          tipo: 'clase',
          titulo: c.clase.nombre,
          subtitulo: subtituloPartes || undefined,
          fecha_inicio: c.fecha_inicio.toISOString(),
          fecha_fin: c.fecha_fin.toISOString(),
          fecha_creacion: c.fecha_creacion
            ? c.fecha_creacion.toISOString()
            : null,
          estado: c.clase_reserva_estado.descripcion,
          sede: {
            id_sede: c.clase.sede.id_sede,
            nombre: c.clase.sede.nombre,
            direccion: c.clase.sede.direccion,
          },
        });
      }
    }

    // Ordenar por momento de reserva (más reciente primero). Las reservas sin
    // fecha_creacion (anteriores a este dato) van al final, ordenadas por fecha_inicio.
    items.sort((a, b) => {
      const creacionA = a.fecha_creacion
        ? new Date(a.fecha_creacion).getTime()
        : null;
      const creacionB = b.fecha_creacion
        ? new Date(b.fecha_creacion).getTime()
        : null;

      if (creacionA !== null && creacionB !== null && creacionA !== creacionB) {
        return creacionB - creacionA;
      }
      if (creacionA !== null && creacionB === null) return -1;
      if (creacionA === null && creacionB !== null) return 1;

      const diffFecha =
        new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime();
      if (diffFecha !== 0) return diffFecha;
      const idA = Number(a.id.split('-')[1] ?? 0);
      const idB = Number(b.id.split('-')[1] ?? 0);
      return idB - idA;
    });

    const total = items.length;
    const total_paginas = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedItems = items.slice(startIndex, startIndex + limit);

    return {
      items: paginatedItems,
      meta: {
        total,
        page,
        limit,
        total_paginas,
      },
    };
  }

  /**
   * Obtiene el resumen de métricas, membresía y próximas reservas para el Dashboard del Socio.
   */
  async obtenerDashboard(
    id_usuario: number,
  ): Promise<SocioDashboardResponseDto> {
    const ahora = new Date();

    // 1. Membresía más relevante o activa
    const membresiaRow = await this.prisma.membresia.findFirst({
      where: {
        id_usuario,
      },
      orderBy: [{ fecha_fin: 'desc' }, { id_membresia: 'desc' }],
      select: {
        id_membresia: true,
        fecha_inicio: true,
        fecha_fin: true,
        renovacion_automatica: true,
        membresia_plan: {
          select: { nombre: true },
        },
        membresia_estado: {
          select: { descripcion: true },
        },
      },
    });

    let membresiaResumen: MembresiaResumenDto | null = null;
    if (membresiaRow) {
      const fechaFinMs = new Date(membresiaRow.fecha_fin).getTime();
      const ahoraMs = ahora.getTime();
      const diffDias = Math.ceil(
        (fechaFinMs - ahoraMs) / (1000 * 60 * 60 * 24),
      );

      membresiaResumen = {
        id_membresia: membresiaRow.id_membresia,
        plan: membresiaRow.membresia_plan.nombre,
        estado: membresiaRow.membresia_estado.descripcion,
        fecha_inicio:
          membresiaRow.fecha_inicio instanceof Date
            ? membresiaRow.fecha_inicio.toISOString().slice(0, 10)
            : String(membresiaRow.fecha_inicio).slice(0, 10),
        fecha_fin:
          membresiaRow.fecha_fin instanceof Date
            ? membresiaRow.fecha_fin.toISOString().slice(0, 10)
            : String(membresiaRow.fecha_fin).slice(0, 10),
        dias_restantes: Math.max(0, diffDias),
        renovacion_automatica: membresiaRow.renovacion_automatica,
      };
    }

    // 2. Conteo de reservas históricas de canchas y clases
    const [totalCanchas, totalClases] = await Promise.all([
      this.prisma.canchaReserva.count({ where: { id_usuario } }),
      this.prisma.claseReserva.count({ where: { id_usuario } }),
    ]);

    // 3. Próximas reservas a partir de la fecha/hora actual
    const [proximasCanchasRaw, proximasClasesRaw] = await Promise.all([
      this.prisma.canchaReserva.findMany({
        where: {
          id_usuario,
          fecha_inicio: { gte: ahora },
          cancha_reserva_estado: {
            descripcion: {
              contains: 'confirmada',
              mode: 'insensitive',
            },
          },
        },
        orderBy: { fecha_inicio: 'asc' },
        take: 5,
        select: {
          id_cancha_reserva: true,
          fecha_inicio: true,
          fecha_fin: true,
          fecha_creacion: true,
          precio_congelado: true,
          cancha: {
            select: {
              nombre: true,
              cancha_tipo: { select: { descripcion: true } },
              sede: {
                select: { id_sede: true, nombre: true, direccion: true },
              },
            },
          },
          cancha_reserva_estado: {
            select: { descripcion: true },
          },
        },
      }),
      this.prisma.claseReserva.findMany({
        where: {
          id_usuario,
          fecha_inicio: { gte: ahora },
          clase_reserva_estado: {
            descripcion: {
              contains: 'confirmada',
              mode: 'insensitive',
            },
          },
        },
        orderBy: { fecha_inicio: 'asc' },
        take: 5,
        select: {
          id_clase_reserva: true,
          fecha_inicio: true,
          fecha_fin: true,
          fecha_creacion: true,
          clase: {
            select: {
              nombre: true,
              profesor: true,
              sala: true,
              sede: {
                select: { id_sede: true, nombre: true, direccion: true },
              },
            },
          },
          clase_reserva_estado: {
            select: { descripcion: true },
          },
        },
      }),
    ]);

    const proximasActividades: ItemHistorialDto[] = [];

    for (const r of proximasCanchasRaw) {
      proximasActividades.push({
        id: `cancha-${r.id_cancha_reserva}`,
        tipo: 'cancha',
        titulo: r.cancha.nombre,
        subtitulo: r.cancha.cancha_tipo.descripcion,
        fecha_inicio: r.fecha_inicio.toISOString(),
        fecha_fin: r.fecha_fin.toISOString(),
        fecha_creacion: r.fecha_creacion
          ? r.fecha_creacion.toISOString()
          : null,
        estado: r.cancha_reserva_estado.descripcion,
        sede: {
          id_sede: r.cancha.sede.id_sede,
          nombre: r.cancha.sede.nombre,
          direccion: r.cancha.sede.direccion,
        },
        precio:
          r.precio_congelado != null ? Number(r.precio_congelado) : undefined,
      });
    }

    for (const c of proximasClasesRaw) {
      const subtituloPartes = [c.clase.profesor, c.clase.sala]
        .filter(Boolean)
        .join(' - ');

      proximasActividades.push({
        id: `clase-${c.id_clase_reserva}`,
        tipo: 'clase',
        titulo: c.clase.nombre,
        subtitulo: subtituloPartes || undefined,
        fecha_inicio: c.fecha_inicio.toISOString(),
        fecha_fin: c.fecha_fin.toISOString(),
        fecha_creacion: c.fecha_creacion
          ? c.fecha_creacion.toISOString()
          : null,
        estado: c.clase_reserva_estado.descripcion,
        sede: {
          id_sede: c.clase.sede.id_sede,
          nombre: c.clase.sede.nombre,
          direccion: c.clase.sede.direccion,
        },
      });
    }

    // Ordenar próximas actividades de forma ascendente (las más inmediatas primero)
    proximasActividades.sort(
      (a, b) =>
        new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime(),
    );

    const totales: TotalesActividadesDto = {
      total_canchas: totalCanchas,
      total_clases: totalClases,
      total_actividades: totalCanchas + totalClases,
      proximas_confirmadas: proximasActividades.length,
    };

    return {
      membresia: membresiaResumen,
      totales,
      proximas_actividades: proximasActividades.slice(0, 5),
    };
  }
}
