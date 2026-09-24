import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma-service/prisma.service';
import { Prisma, Cancha } from '@prisma/client';

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

  async obtenerTodasActivas(): Promise<Cancha[]> {
    return this.prisma.cancha.findMany({
      where: { activo: true },
      include: {
        sede: true,
        cancha_tipo: true,
      },
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
}
