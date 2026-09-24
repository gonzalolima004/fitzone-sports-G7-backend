import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma-service/prisma.service';
import { CanchaReserva, CanchaMantenimiento, Prisma } from '@prisma/client';

@Injectable()
export class ReservasCanchasRepository {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerReservasPorFecha(
    id_cancha: number,
    inicioDia: Date,
    finDia: Date,
  ): Promise<CanchaReserva[]> {
    return this.prisma.canchaReserva.findMany({
      where: {
        id_cancha,
        fecha_inicio: { gte: inicioDia },
        fecha_fin: { lte: finDia },
      },
    });
  }

  async obtenerMantenimientosPorFecha(
    id_cancha: number,
    inicioDia: Date,
    finDia: Date,
  ): Promise<CanchaMantenimiento[]> {
    return this.prisma.canchaMantenimiento.findMany({
      where: {
        id_cancha,
        fecha_inicio: { lt: finDia },
        fecha_fin: { gt: inicioDia },
      },
    });
  }
  /**
   * Ejecuta la validación de solapamiento y la inserción de manera atómica (RN-02).
   */
  async crearReservaTransaccional(
    data: Prisma.CanchaReservaUncheckedCreateInput,
  ): Promise<CanchaReserva> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Buscar si ya existe una reserva que se solape en ese rango de tiempo
      const colision = await tx.canchaReserva.findFirst({
        where: {
          id_cancha: data.id_cancha,
          // Verifica si los horarios se cruzan con una reserva activa
          fecha_inicio: { lt: new Date(data.fecha_fin) },
          fecha_fin: { gt: new Date(data.fecha_inicio) },
        },
      });

      if (colision) {
        throw new ConflictException(
          'La cancha ya fue reservada en este horario exacto por otro usuario.',
        );
      }

      // 2. Si no hay colisión, se crea la reserva en la misma transacción
      return tx.canchaReserva.create({
        data,
      });
    });
  }
}
