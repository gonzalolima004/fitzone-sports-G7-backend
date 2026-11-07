import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma-service/prisma.service';
import { Prisma, Pago } from '@prisma/client';
import { calcularFechaFin } from '../../M1-usuarios/utils/plan-duracion';
import {
  MEMBRESIA_ESTADO,
  PAGO_ESTADO,
  RESERVA_ESTADO,
} from '../constants/estados.constants';

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

export type ReservaPendienteDePago = Prisma.CanchaReservaGetPayload<{
  include: {
    cancha: {
      include: {
        sede: true;
      };
    };
  };
}>;

export type MembresiaConPlanYEstado = Prisma.MembresiaGetPayload<{
  include: {
    membresia_plan: true;
    membresia_estado: true;
  };
}>;

@Injectable()
export class PagosRepository {
  constructor(private readonly prisma: PrismaService) {}

  async crearPago(data: Prisma.PagoUncheckedCreateInput): Promise<Pago> {
    return this.prisma.pago.create({
      data,
    });
  }

  async actualizarPagoPendiente(
    id_pago: number,
    data: {
      monto: number;
      token_transaccion: string;
    },
  ): Promise<Pago> {
    return this.prisma.pago.update({
      where: { id_pago },
      data: {
        monto: data.monto,
        token_transaccion: data.token_transaccion,
        fecha_pago: new Date(),
      },
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
    return this.prisma.pago.findFirst({
      where: {
        id_cancha_reserva,
        pago_estado: {
          descripcion: { equals: PAGO_ESTADO.PENDIENTE, mode: 'insensitive' },
        },
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
    return this.prisma.pago.findFirst({
      where: {
        id_membresia,
        pago_estado: {
          descripcion: { equals: PAGO_ESTADO.PENDIENTE, mode: 'insensitive' },
        },
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

  async obtenerPlanPorId(id_membresia_plan: number) {
    return this.prisma.membresiaPlan.findUnique({
      where: { id_membresia_plan },
    });
  }

  async obtenerUsuarioPorId(id_usuario: number) {
    return this.prisma.usuario.findUnique({
      where: { id_usuario },
    });
  }

  async obtenerUsuarioPorEmail(email: string) {
    return this.prisma.usuario.findFirst({
      where: { email },
    });
  }

  async obtenerMembresiaPorId(id_membresia: number) {
    return this.prisma.membresia.findUnique({
      where: { id_membresia },
      include: { membresia_plan: true },
    });
  }

  /**
   * Busca una membresÃ­a en estado 'Suspendida' del usuario que nunca haya tenido
   * un pago 'Aprobado' (intenciÃ³n de suscripciÃ³n abierta sin abonar).
   */
  async obtenerMembresiaSuspendidaSinPagoAprobado(id_usuario: number) {
    return this.prisma.membresia.findFirst({
      where: {
        id_usuario,
        membresia_estado: {
          descripcion: {
            equals: MEMBRESIA_ESTADO.SUSPENDIDA,
            mode: 'insensitive',
          },
        },
        pagos: {
          none: {
            pago_estado: {
              descripcion: {
                equals: PAGO_ESTADO.APROBADO,
                mode: 'insensitive',
              },
            },
          },
        },
      },
      orderBy: { id_membresia: 'desc' },
    });
  }

  async actualizarIntencionMembresia(
    id_membresia: number,
    data: {
      id_membresia_plan: number;
    },
  ) {
    return this.prisma.membresia.update({
      where: { id_membresia },
      data: {
        id_membresia_plan: data.id_membresia_plan,
        fecha_inicio: new Date(),
        fecha_fin: new Date(),
      },
    });
  }

  async crearMembresia(data: {
    id_usuario: number;
    id_membresia_plan: number;
    id_membresia_estado: number;
    fecha_inicio: Date;
    fecha_fin: Date;
  }) {
    return this.prisma.membresia.create({
      data,
    });
  }

  /**
   * Ejecuta la confirmaciÃ³n transaccional atÃ³mica de un pago y su recurso asociado.
   * Dentro de un $transaction:
   * 1. Actualiza el pago a 'Aprobado' y asigna comprobante_url
   * 2. Si tiene cancha_reserva: actualiza su estado a 'Confirmada'
   * 3. Si tiene membresia: calcula vigencia, actualiza su estado a 'Activa' y desactiva anteriores
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
    id_membresia_estado_suspendida?: number;
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

      // 3. Activar membresÃ­a si existe calculando fechas de vigencia
      if (params.id_membresia && params.id_membresia_estado) {
        const memb = await tx.membresia.findUnique({
          where: { id_membresia: params.id_membresia },
          include: { membresia_plan: true },
        });

        if (memb) {
          const idEstadoSuspendida = params.id_membresia_estado_suspendida;
          if (!idEstadoSuspendida) {
            throw new Error(
              'Falta id_membresia_estado_suspendida para confirmar la membresÃ­a.',
            );
          }
          const ahora = new Date();

          // Buscar Ãºltima membresÃ­a activa vigente del usuario distinta a esta
          const ultimaActiva = await tx.membresia.findFirst({
            where: {
              id_usuario: memb.id_usuario,
              id_membresia: { not: memb.id_membresia },
              membresia_estado: {
                descripcion: {
                  equals: MEMBRESIA_ESTADO.ACTIVA,
                  mode: 'insensitive',
                },
              },
              fecha_fin: { gte: ahora },
            },
            orderBy: { fecha_fin: 'desc' },
          });

          let baseDate = ahora;
          if (ultimaActiva && new Date(ultimaActiva.fecha_fin) > baseDate) {
            baseDate = new Date(ultimaActiva.fecha_fin);
          }

          const dias = memb.membresia_plan?.duracion_dias || 30;
          const fechaInicio = ahora;
          const fechaFin = calcularFechaFin(baseDate, dias);

          // Desactivar membresÃ­as activas anteriores del usuario
          await tx.membresia.updateMany({
            where: {
              id_usuario: memb.id_usuario,
              id_membresia: { not: memb.id_membresia },
              membresia_estado: {
                descripcion: {
                  equals: MEMBRESIA_ESTADO.ACTIVA,
                  mode: 'insensitive',
                },
              },
            },
            data: {
              id_membresia_estado: idEstadoSuspendida,
            },
          });

          // Actualizar y activar membresÃ­a
          await tx.membresia.update({
            where: { id_membresia: params.id_membresia },
            data: {
              id_membresia_estado: params.id_membresia_estado,
              fecha_inicio: fechaInicio,
              fecha_fin: fechaFin,
            },
          });

          // Promover permanentemente al usuario con rol 'externo' (o sin roles) al rol 'socio'
          const rolesActuales = await tx.usuarioRol.findMany({
            where: { id_usuario: memb.id_usuario },
            include: { rol: true },
          });

          const tieneRolExterno = rolesActuales.some(
            (ur) => ur.rol?.nombre?.trim().toLowerCase() === 'externo',
          );
          const sinRoles = rolesActuales.length === 0;

          if (tieneRolExterno || sinRoles) {
            if (tieneRolExterno) {
              await tx.usuarioRol.deleteMany({
                where: {
                  id_usuario: memb.id_usuario,
                  rol: {
                    nombre: { equals: 'externo', mode: 'insensitive' },
                  },
                },
              });
            }

            let rolSocio = await tx.rol.findFirst({
              where: { nombre: { equals: 'socio', mode: 'insensitive' } },
            });
            if (!rolSocio) {
              rolSocio = await tx.rol.create({
                data: { nombre: 'socio' },
              });
            }

            await tx.usuarioRol.upsert({
              where: {
                id_usuario_id_rol: {
                  id_usuario: memb.id_usuario,
                  id_rol: rolSocio.id_rol,
                },
              },
              update: {},
              create: {
                id_usuario: memb.id_usuario,
                id_rol: rolSocio.id_rol,
              },
            });
          }
        }
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

  async obtenerCanchaReservaPorId(id_cancha_reserva: number) {
    return this.prisma.canchaReserva.findUnique({
      where: { id_cancha_reserva },
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
   * de cancha, sede, plan de membresÃ­a y estado.
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
   * Obtiene la lista cronolÃ³gica de pagos asociados a un usuario (identificado por id_usuario)
   * a travÃ©s de sus reservas de cancha o membresÃ­as adquiridas, excluyendo intenciones
   * de checkout abandonadas en estado 'Pendiente'.
   */
  async obtenerHistorialPorUsuario(
    id_usuario: number,
  ): Promise<PagoConDetalleCompleto[]> {
    return this.prisma.pago.findMany({
      where: {
        OR: [{ cancha_reserva: { id_usuario } }, { membresia: { id_usuario } }],
        NOT: {
          pago_estado: {
            descripcion: { equals: PAGO_ESTADO.PENDIENTE, mode: 'insensitive' },
          },
        },
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

  /**
   * Reservas futuras del usuario que no fueron canceladas ni confirmadas
   * y que no tienen ningÃºn pago aprobado asociado.
   */
  async obtenerReservasPendientesDePago(
    id_usuario: number,
  ): Promise<ReservaPendienteDePago[]> {
    return this.prisma.canchaReserva.findMany({
      where: {
        id_usuario,
        fecha_fin: { gte: new Date() },
        NOT: [
          {
            cancha_reserva_estado: {
              descripcion: {
                equals: RESERVA_ESTADO.CANCELADA,
                mode: 'insensitive',
              },
            },
          },
          {
            cancha_reserva_estado: {
              descripcion: {
                equals: RESERVA_ESTADO.CONFIRMADA,
                mode: 'insensitive',
              },
            },
          },
        ],
        pagos: {
          none: {
            pago_estado: {
              descripcion: {
                equals: PAGO_ESTADO.APROBADO,
                mode: 'insensitive',
              },
            },
          },
        },
      },
      orderBy: { fecha_inicio: 'asc' },
      include: {
        cancha: {
          include: {
            sede: true,
          },
        },
      },
    });
  }

  /**
   * Ãšltima membresÃ­a del usuario (la de mayor fecha de fin), con plan y estado,
   * considerando Ãºnicamente membresÃ­as en estado 'Activa' o 'Vencida'.
   */
  async obtenerUltimaMembresiaDeUsuario(
    id_usuario: number,
  ): Promise<MembresiaConPlanYEstado | null> {
    return this.prisma.membresia.findFirst({
      where: {
        id_usuario,
        OR: [
          {
            membresia_estado: {
              OR: [
                {
                  descripcion: {
                    equals: MEMBRESIA_ESTADO.ACTIVA,
                    mode: 'insensitive',
                  },
                },
                {
                  descripcion: {
                    equals: MEMBRESIA_ESTADO.VENCIDA,
                    mode: 'insensitive',
                  },
                },
              ],
            },
          },
          // Suspendida por el socio (con pago aprobado): no genera pendiente.
          {
            membresia_estado: {
              descripcion: {
                equals: MEMBRESIA_ESTADO.SUSPENDIDA,
                mode: 'insensitive',
              },
            },
            pagos: {
              some: {
                pago_estado: {
                  descripcion: {
                    equals: PAGO_ESTADO.APROBADO,
                    mode: 'insensitive',
                  },
                },
              },
            },
          },
        ],
      },
      orderBy: { fecha_fin: 'desc' },
      include: {
        membresia_plan: true,
        membresia_estado: true,
      },
    });
  }

  /**
   * Indica si la membresÃ­a tiene un pago aprobado realizado desde la fecha dada.
   */
  async existePagoAprobadoDeMembresiaDesde(
    id_membresia: number,
    desde: Date,
  ): Promise<boolean> {
    const cantidad = await this.prisma.pago.count({
      where: {
        id_membresia,
        fecha_pago: { gte: desde },
        pago_estado: {
          descripcion: { equals: PAGO_ESTADO.APROBADO, mode: 'insensitive' },
        },
      },
    });
    return cantidad > 0;
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

  /**
   * Obtiene todos los pagos en estado 'Pendiente' pertenecientes a un usuario
   * (tanto de membresÃ­a como de reserva de cancha).
   */
  async obtenerPagosPendientesPorUsuario(
    id_usuario: number,
  ): Promise<PagoConRelaciones[]> {
    return this.prisma.pago.findMany({
      where: {
        pago_estado: {
          descripcion: { equals: PAGO_ESTADO.PENDIENTE, mode: 'insensitive' },
        },
        OR: [{ membresia: { id_usuario } }, { cancha_reserva: { id_usuario } }],
      },
      orderBy: { id_pago: 'desc' },
      include: {
        pago_estado: true,
        cancha_reserva: true,
        membresia: true,
      },
    });
  }
}
