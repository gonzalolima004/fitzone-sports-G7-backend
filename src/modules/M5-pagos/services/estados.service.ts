import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma-service/prisma.service';
import {
  MEMBRESIA_ESTADO,
  PAGO_ESTADO,
  RESERVA_ESTADO,
} from '../constants/estados.constants';

type Catalogo = 'pago' | 'membresia' | 'reserva';

/**
 * Resuelve el ID de los estados del dominio de pagos a partir de su descripción,
 * con caché en memoria, para evitar IDs hardcodeados.
 */
@Injectable()
export class EstadosService {
  private readonly logger = new Logger(EstadosService.name);
  private readonly cache = new Map<string, number>();

  constructor(private readonly prisma: PrismaService) {}

  getPagoEstadoId(descripcion: string): Promise<number> {
    return this.resolver('pago', descripcion);
  }

  getMembresiaEstadoId(descripcion: string): Promise<number> {
    return this.resolver('membresia', descripcion);
  }

  getReservaEstadoId(descripcion: string): Promise<number> {
    return this.resolver('reserva', descripcion);
  }

  getPagoPendienteId(): Promise<number> {
    return this.getPagoEstadoId(PAGO_ESTADO.PENDIENTE);
  }

  getPagoAprobadoId(): Promise<number> {
    return this.getPagoEstadoId(PAGO_ESTADO.APROBADO);
  }

  getPagoRechazadoId(): Promise<number> {
    return this.getPagoEstadoId(PAGO_ESTADO.RECHAZADO);
  }

  getMembresiaActivaId(): Promise<number> {
    return this.getMembresiaEstadoId(MEMBRESIA_ESTADO.ACTIVA);
  }

  getMembresiaSuspendidaId(): Promise<number> {
    return this.getMembresiaEstadoId(MEMBRESIA_ESTADO.SUSPENDIDA);
  }

  getReservaConfirmadaId(): Promise<number> {
    return this.getReservaEstadoId(RESERVA_ESTADO.CONFIRMADA);
  }

  private async resolver(
    catalogo: Catalogo,
    descripcion: string,
  ): Promise<number> {
    const clave = `${catalogo}:${descripcion.toLowerCase()}`;
    const enCache = this.cache.get(clave);
    if (enCache !== undefined) return enCache;

    const id = await this.buscarOCrear(catalogo, descripcion);
    this.cache.set(clave, id);
    return id;
  }

  private async buscarOCrear(
    catalogo: Catalogo,
    descripcion: string,
  ): Promise<number> {
    const where = {
      descripcion: { equals: descripcion, mode: 'insensitive' },
    } as const;
    const data = { descripcion };

    switch (catalogo) {
      case 'pago': {
        const e = await this.prisma.pagoEstado.findFirst({ where });
        if (e) return e.id_pago_estado;
        this.logger.warn(
          `Estado de pago '${descripcion}' inexistente; se crea.`,
        );
        return (await this.prisma.pagoEstado.create({ data })).id_pago_estado;
      }
      case 'membresia': {
        const e = await this.prisma.membresiaEstado.findFirst({ where });
        if (e) return e.id_membresia_estado;
        this.logger.warn(
          `Estado de membresía '${descripcion}' inexistente; se crea.`,
        );
        return (await this.prisma.membresiaEstado.create({ data }))
          .id_membresia_estado;
      }
      case 'reserva': {
        const e = await this.prisma.canchaReservaEstado.findFirst({ where });
        if (e) return e.id_cancha_reserva_estado;
        this.logger.warn(
          `Estado de reserva '${descripcion}' inexistente; se crea.`,
        );
        return (await this.prisma.canchaReservaEstado.create({ data }))
          .id_cancha_reserva_estado;
      }
    }
  }
}
