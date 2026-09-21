import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma-service/prisma.service';
import { Prisma, Pago, PagoEstado } from '@prisma/client';

@Injectable()
export class PagosRepository {
  constructor(private readonly prisma: PrismaService) {}

  async crearPago(data: Prisma.PagoUncheckedCreateInput): Promise<Pago> {
    return this.prisma.pago.create({
      data,
    });
  }

  async obtenerPorId(id_pago: number): Promise<Pago | null> {
    return this.prisma.pago.findUnique({
      where: { id_pago },
      include: {
        pago_estado: true,
        cancha_reserva: true,
        membresia: true,
      },
    });
  }

  async obtenerPorTokenTransaccion(
    token_transaccion: string,
  ): Promise<Pago | null> {
    return this.prisma.pago.findFirst({
      where: { token_transaccion },
      include: {
        pago_estado: true,
        cancha_reserva: true,
        membresia: true,
      },
    });
  }

  async actualizarEstado(
    id_pago: number,
    id_pago_estado: number,
  ): Promise<Pago> {
    return this.prisma.pago.update({
      where: { id_pago },
      data: { id_pago_estado },
    });
  }

  async obtenerEstadoPorDescripcion(
    descripcion: string,
  ): Promise<PagoEstado | null> {
    return this.prisma.pagoEstado.findFirst({
      where: {
        descripcion: {
          equals: descripcion,
          mode: 'insensitive',
        },
      },
    });
  }

  async obtenerEstadoPendienteId(): Promise<number> {
    const estado = await this.obtenerEstadoPorDescripcion('Pendiente');
    if (estado) {
      return estado.id_pago_estado;
    }

    const nuevoEstado = await this.prisma.pagoEstado.create({
      data: {
        descripcion: 'Pendiente',
      },
    });
    return nuevoEstado.id_pago_estado;
  }

  async existeCanchaReserva(id_cancha_reserva: number): Promise<boolean> {
    const reserva = await this.prisma.canchaReserva.findUnique({
      where: { id_cancha_reserva },
    });
    return !!reserva;
  }

  async existeMembresia(id_membresia: number): Promise<boolean> {
    const membresia = await this.prisma.membresia.findUnique({
      where: { id_membresia },
    });
    return !!membresia;
  }
}
