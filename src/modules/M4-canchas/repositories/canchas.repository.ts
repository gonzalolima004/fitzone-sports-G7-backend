import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma-service/prisma.service';
import {
  Prisma,
  Cancha,
  CanchaMantenimiento,
  CanchaTipo,
} from '@prisma/client';

/**
 * PATRÓN REPOSITORY: Centraliza y encapsula todas las consultas a la base de datos
 * para la entidad Cancha. La lógica de negocio (Service) no debe conocer detalles de Prisma.
 */
@Injectable()
export class CanchasRepository {
  constructor(private readonly prisma: PrismaService) {}

  async crear(data: Prisma.CanchaUncheckedCreateInput): Promise<Cancha> {
    return this.prisma.cancha.create({
      data,
    });
  }

  /**
   * Consulta nueva para la grilla
   * con filtro opcional para tipo de cancha.
   */
  async obtenerCanchasParaGrilla(sedeId: number, tipoId?: number) {
    return this.prisma.cancha.findMany({
      where: {
        id_sede: sedeId,
        activo: true,
        ...(tipoId ? { id_cancha_tipo: tipoId } : {}),
      },
    });
  }

  async obtenerTodasActivas(sedeId?: number): Promise<Cancha[]> {
    const temp = await this.prisma.cancha.findMany({
      where: { activo: true, ...(sedeId ? { id_sede: sedeId } : {}) },
      include: {
        sede: true,
        cancha_tipo: true,
      },
    });
    return temp;
  }

  async obtenerTiposCancha(inactivos?: boolean): Promise<CanchaTipo[]> {
    return this.prisma.canchaTipo.findMany({
      where: (inactivos === true
        ? {}
        : { activo: true }) as unknown as Prisma.CanchaTipoWhereInput,
    });
  }

  async obtenerPorId(id_cancha: number) {
    return this.prisma.cancha.findUnique({
      where: { id_cancha },
      include: {
        sede: true,
        cancha_tipo: true,
      },
    });
  }

  /**
   * Obtiene los datos del usuario requeridos para la cotización de turnos mediante Prisma.
   * Utiliza selección granular de campos (select) y filtrado opcional de membresía por fecha
   * para minimizar la transferencia de datos y la sobrecarga de consultas relacionales.
   */
  async obtenerDatosUsuarioParaCotizacion(
    idUsuario: number,
    fechaTurno?: string,
  ) {
    const fechaFiltro = fechaTurno ? new Date(fechaTurno) : undefined;

    return this.prisma.usuario.findUnique({
      where: { id_usuario: idUsuario },
      select: {
        id_usuario: true,
        id_sede: true,
        sede: {
          select: {
            id_sede: true,
            id_ciudad: true,
          },
        },
        usuario_rol: {
          select: {
            id_usuario: true,
            id_rol: true,
            rol: {
              select: {
                id_rol: true,
                nombre: true,
              },
            },
          },
        },
        membresia: {
          where: fechaFiltro
            ? {
                fecha_inicio: { lte: fechaFiltro },
                fecha_fin: { gte: fechaFiltro },
              }
            : undefined,
          select: {
            id_membresia: true,
            id_usuario: true,
            id_membresia_plan: true,
            id_membresia_estado: true,
            fecha_inicio: true,
            fecha_fin: true,
            renovacion_automatica: true,
            membresia_estado: {
              select: {
                id_membresia_estado: true,
                descripcion: true,
              },
            },
            pagos: {
              where: {
                pago_estado: {
                  descripcion: { equals: 'Aprobado', mode: 'insensitive' },
                },
              },
              select: {
                id_pago: true,
              },
            },
          },
        },
      },
    });
  }

  async actualizar(
    id_cancha: number,
    data: Prisma.CanchaUncheckedUpdateInput,
  ): Promise<Cancha> {
    return this.prisma.cancha.update({
      where: { id_cancha },
      data,
    });
  }

  async borradoLogico(id_cancha: number): Promise<Cancha> {
    // Borrado lógico: cambiamos el estado activo a false en lugar de eliminar el registro físico
    return this.prisma.cancha.update({
      where: { id_cancha },
      data: { activo: false, disponible: false },
    });
  }

  async existeSede(id_sede: number): Promise<boolean> {
    const sede = await this.prisma.sede.findUnique({
      where: { id_sede },
    });
    return !!sede;
  }

  async existeTipoCancha(id_cancha_tipo: number): Promise<boolean> {
    const tipo = await this.prisma.canchaTipo.findUnique({
      where: { id_cancha_tipo },
    });
    return !!tipo;
  }

  /**
   * Registra un nuevo mantenimiento para la cancha sin afectar las reservas existentes.
   */
  async crearMantenimiento(
    data: Prisma.CanchaMantenimientoUncheckedCreateInput,
  ): Promise<CanchaMantenimiento> {
    return this.prisma.canchaMantenimiento.create({
      data,
    });
  }

  /**
   * Obtiene la lista de mantenimientos aplicando filtros opcionales (sede, cancha y rango de fechas)
   * de forma directa y optimizada en una sola consulta a la base de datos.
   */
  async obtenerMantenimientos(filtros: {
    sedeId?: number;
    canchaId?: number;
    fechaInicio?: Date;
    fechaFin?: Date;
  }): Promise<CanchaMantenimiento[]> {
    const where: Prisma.CanchaMantenimientoWhereInput = {};

    if (filtros.canchaId) {
      where.id_cancha = filtros.canchaId;
    }

    if (filtros.sedeId) {
      where.cancha = {
        id_sede: filtros.sedeId,
      };
    }

    if (filtros.fechaInicio && filtros.fechaFin) {
      // Solapamiento de rangos: inicia antes o durante fin de rango y finaliza después o durante inicio de rango
      where.fecha_inicio = { lte: filtros.fechaFin };
      where.fecha_fin = { gte: filtros.fechaInicio };
    } else if (filtros.fechaInicio) {
      where.fecha_fin = { gte: filtros.fechaInicio };
    } else if (filtros.fechaFin) {
      where.fecha_inicio = { lte: filtros.fechaFin };
    }

    return this.prisma.canchaMantenimiento.findMany({
      where,
      include: {
        cancha: {
          include: {
            sede: true,
            cancha_tipo: true,
          },
        },
      },
      orderBy: {
        fecha_inicio: 'asc',
      },
    });
  }

  async crearTipoCancha(descripcion: string): Promise<CanchaTipo> {
    return this.prisma.canchaTipo.create({
      data: { descripcion },
    });
  }

  async actualizarTipoCancha(
    id_cancha_tipo: number,
    data: { descripcion?: string; activo?: boolean },
  ): Promise<CanchaTipo> {
    return this.prisma.canchaTipo.update({
      where: { id_cancha_tipo },
      data: data,
    });
  }

  async contarCanchasActivasPorTipo(id_cancha_tipo: number): Promise<number> {
    return this.prisma.cancha.count({
      where: {
        id_cancha_tipo,
        activo: true,
      },
    });
  }

  async borradoLogicoTipoCancha(id_cancha_tipo: number): Promise<CanchaTipo> {
    // Borrado lógico: se actualizará el campo 'activo' a false una vez sincronizado en Supabase y Prisma.
    // Descomentar la llamada a Prisma cuando el campo 'activo' exista en cancha_tipo:
    return this.prisma.canchaTipo.update({
      where: { id_cancha_tipo },
      data: { activo: false },
    });
  }
}
