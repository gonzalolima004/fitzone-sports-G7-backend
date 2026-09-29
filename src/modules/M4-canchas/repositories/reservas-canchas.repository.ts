import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma-service/prisma.service';
import { CanchaReserva, CanchaMantenimiento } from '@prisma/client';

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
}
