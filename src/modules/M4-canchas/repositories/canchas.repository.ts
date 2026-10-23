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

  async obtenerPorId(id_cancha: number): Promise<Cancha | null> {
    return this.prisma.cancha.findUnique({
      where: { id_cancha },
      include: {
        sede: true,
        cancha_tipo: true,
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
   * Registra un nuevo mantenimiento para la cancha sin afectar las reservas existentes (RF-12).
   */
  async crearMantenimiento(
    data: Prisma.CanchaMantenimientoUncheckedCreateInput,
  ): Promise<CanchaMantenimiento> {
    return this.prisma.canchaMantenimiento.create({
      data,
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
