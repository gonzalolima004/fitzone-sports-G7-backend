import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma-service/prisma.service';
import { Prisma, Pago, PagoEstado } from '@prisma/client';

export type PagoConRelaciones = Prisma.PagoGetPayload<{
  include: {
    pago_estado: true;
    cancha_reserva: true;
    membresia: true;
  };
}>;

export type PagoConDetalleCompleto = Prisma.PagoGetPayload<{
  include: {
    pago_estado: true;
    cancha_reserva: {
      include: {
        cancha: {
          include: {
            sede: true;
          };
        };
        usuario: true;
      };
    };
    membresia: {
      include: {
        membresia_plan: true;
        usuario: true;
      };
    };
  };
}>;

export type PagoParaComprobante = PagoConDetalleCompleto;

@Injectable()
export class PagosRepository {
  constructor(private readonly prisma: PrismaService) {}

  async crearPago(data: Prisma.PagoUncheckedCreateInput): Promise<Pago> {
    return this.prisma.pago.create({
      data,
    });
  }

  async obtenerPorId(id_pago: number): Promise<PagoConRelaciones | null> {
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
  ): Promise<PagoConRelaciones | null> {
    return this.prisma.pago.findFirst({
      where: { token_transaccion },
      include: {
        pago_estado: true,
        cancha_reserva: true,
        membresia: true,
      },
    });
  }

  async obtenerUltimoPagoPendienteCancha(
    id_cancha_reserva: number,
  ): Promise<PagoConRelaciones | null> {
    const idPagoEstadoPendiente = await this.obtenerEstadoPendienteId();
    return this.prisma.pago.findFirst({
      where: {
        id_cancha_reserva,
        id_pago_estado: idPagoEstadoPendiente,
      },
      orderBy: { id_pago: 'desc' },
      include: {
        pago_estado: true,
        cancha_reserva: true,
        membresia: true,
      },
    });
  }

  async obtenerUltimoPagoPendienteMembresia(
    id_membresia: number,
  ): Promise<PagoConRelaciones | null> {
    const idPagoEstadoPendiente = await this.obtenerEstadoPendienteId();
    return this.prisma.pago.findFirst({
      where: {
        id_membresia,
        id_pago_estado: idPagoEstadoPendiente,
      },
      orderBy: { id_pago: 'desc' },
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

  async obtenerEstadoAprobadoId(): Promise<number> {
    const estado = await this.obtenerEstadoPorDescripcion('Aprobado');
    if (estado) {
      return estado.id_pago_estado;
    }

    const nuevoEstado = await this.prisma.pagoEstado.create({
      data: {
        descripcion: 'Aprobado',
      },
    });
    return nuevoEstado.id_pago_estado;
  }

  async obtenerEstadoRechazadoId(): Promise<number> {
    const estado = await this.obtenerEstadoPorDescripcion('Rechazado');
    if (estado) {
      return estado.id_pago_estado;
    }

    const nuevoEstado = await this.prisma.pagoEstado.create({
      data: {
        descripcion: 'Rechazado',
      },
    });
    return nuevoEstado.id_pago_estado;
  }

  async obtenerEstadoReservaConfirmadaId(): Promise<number> {
    const estado = await this.prisma.canchaReservaEstado.findFirst({
      where: {
        descripcion: {
          equals: 'Confirmada',
          mode: 'insensitive',
        },
      },
    });
    if (estado) {
      return estado.id_cancha_reserva_estado;
    }

    const nuevoEstado = await this.prisma.canchaReservaEstado.create({
      data: {
        descripcion: 'Confirmada',
      },
    });
    return nuevoEstado.id_cancha_reserva_estado;
  }

  async obtenerEstadoMembresiaActivaId(): Promise<number> {
    const estado = await this.prisma.membresiaEstado.findFirst({
      where: {
        descripcion: {
          equals: 'Activa',
          mode: 'insensitive',
        },
      },
    });
    if (estado) {
      return estado.id_membresia_estado;
    }

    const nuevoEstado = await this.prisma.membresiaEstado.create({
      data: {
        descripcion: 'Activa',
      },
    });
    return nuevoEstado.id_membresia_estado;
  }

  /**
   * Ejecuta la confirmación transaccional atómica de un pago y su recurso asociado.
   * Dentro de un $transaction:
   * 1. Actualiza el pago a 'Aprobado' y asigna comprobante_url
   * 2. Si tiene cancha_reserva: actualiza su estado a 'Confirmada'
   * 3. Si tiene membresia: actualiza su estado a 'Activa'
   */
  async confirmarPagoTransaccional(params: {
    id_pago: number;
    id_pago_estado: number;
    comprobante_url: string;
    token_transaccion?: string;
    id_cancha_reserva?: number | null;
    id_cancha_reserva_estado?: number;
    id_membresia?: number | null;
    id_membresia_estado?: number;
  }): Promise<PagoConRelaciones> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Actualizar pago
      const pagoActualizado = await tx.pago.update({
        where: { id_pago: params.id_pago },
        data: {
          id_pago_estado: params.id_pago_estado,
          comprobante_url: params.comprobante_url,
          ...(params.token_transaccion
            ? { token_transaccion: params.token_transaccion }
            : {}),
        },
        include: {
          pago_estado: true,
          cancha_reserva: true,
          membresia: true,
        },
      });

      // 2. Confirmar reserva de cancha si existe
      if (params.id_cancha_reserva && params.id_cancha_reserva_estado) {
        await tx.canchaReserva.update({
          where: { id_cancha_reserva: params.id_cancha_reserva },
          data: {
            id_cancha_reserva_estado: params.id_cancha_reserva_estado,
          },
        });
      }

      // 3. Activar membresía si existe
      if (params.id_membresia && params.id_membresia_estado) {
        await tx.membresia.update({
          where: { id_membresia: params.id_membresia },
          data: {
            id_membresia_estado: params.id_membresia_estado,
          },
        });
      }

      return pagoActualizado;
    });
  }

  async marcarPagoRechazado(
    id_pago: number,
    id_pago_estado: number,
  ): Promise<PagoConRelaciones> {
    return this.prisma.pago.update({
      where: { id_pago },
      data: { id_pago_estado },
      include: {
        pago_estado: true,
        cancha_reserva: true,
        membresia: true,
      },
    });
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

  /**
   * Obtiene el detalle completo de un pago por su ID incluyendo relaciones
   * de cancha, sede, plan de membresía y estado.
   */
  async obtenerDetallePorId(
    id_pago: number,
  ): Promise<PagoConDetalleCompleto | null> {
    return this.prisma.pago.findUnique({
      where: { id_pago },
      include: {
        pago_estado: true,
        cancha_reserva: {
          include: {
            cancha: {
              include: {
                sede: true,
              },
            },
            usuario: true,
          },
        },
        membresia: {
          include: {
            membresia_plan: true,
            usuario: true,
          },
        },
      },
    });
  }

  /**
   * Obtiene la lista cronológica de pagos asociados a un usuario (identificado por id_usuario)
   * a través de sus reservas de cancha o membresías adquiridas.
   */
  async obtenerHistorialPorUsuario(
    id_usuario: number,
  ): Promise<PagoConDetalleCompleto[]> {
    return this.prisma.pago.findMany({
      where: {
        OR: [{ cancha_reserva: { id_usuario } }, { membresia: { id_usuario } }],
      },
      orderBy: { fecha_pago: 'desc' },
      include: {
        pago_estado: true,
        cancha_reserva: {
          include: {
            cancha: {
              include: {
                sede: true,
              },
            },
            usuario: true,
          },
        },
        membresia: {
          include: {
            membresia_plan: true,
            usuario: true,
          },
        },
      },
    });
  }

  async obtenerPagoCompletoParaComprobante(
    id_pago: number,
  ): Promise<PagoParaComprobante | null> {
    return this.obtenerDetallePorId(id_pago);
  }

  async actualizarComprobanteUrl(
    id_pago: number,
    comprobante_url: string,
  ): Promise<Pago> {
    return this.prisma.pago.update({
      where: { id_pago },
      data: { comprobante_url },
    });
  }
}
