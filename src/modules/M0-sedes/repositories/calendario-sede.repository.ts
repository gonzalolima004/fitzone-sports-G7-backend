import { Injectable } from '@nestjs/common';
import { calendario, calendario_sede } from '@prisma/client';
import { PrismaService } from '../../../database/prisma-service/prisma.service';

export type ExcepcionConFecha = calendario_sede & { calendario: calendario };

export interface DatosExcepcion {
  cerrado?: boolean;
  hora_apertura?: string | null;
  hora_cierre?: string | null;
  motivo?: string | null;
  id_calendario?: number;
}

/**
 * Excepciones de cada sede al calendario general (cierres o días con horario
 * especial). Ningún método consulta antes de escribir: la existencia de la
 * sede la valida la clave foránea y el "una excepción por sede y día", la
 * restricción única.
 */
@Injectable()
export class CalendarioSedeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySede(
    id_sede: number,
    desde?: Date,
    hasta?: Date,
  ): Promise<ExcepcionConFecha[]> {
    return this.prisma.calendario_sede.findMany({
      where: {
        id_sede,
        ...(desde || hasta
          ? { calendario: { fecha: { gte: desde, lte: hasta } } }
          : {}),
      },
      include: { calendario: true },
      orderBy: { calendario: { fecha: 'asc' } },
    });
  }

  async findById(
    id_calendario_sede: number,
    id_sede: number,
  ): Promise<ExcepcionConFecha | null> {
    return this.prisma.calendario_sede.findFirst({
      where: { id_calendario_sede, id_sede },
      include: { calendario: true },
    });
  }

  /**
   * Devuelve el día del calendario general para la fecha y, si no estaba, lo
   * crea como día común. Es un upsert de PostgreSQL: una sola sentencia.
   */
  async obtenerOCrearDia(fecha: Date): Promise<calendario> {
    return this.prisma.calendario.upsert({
      where: { fecha },
      create: { fecha },
      update: { fecha },
    });
  }

  async obtenerDia(id_calendario: number): Promise<calendario> {
    return this.prisma.calendario.findUniqueOrThrow({
      where: { id_calendario },
    });
  }

  async create(
    id_sede: number,
    id_calendario: number,
    datos: DatosExcepcion,
  ): Promise<calendario_sede> {
    return this.prisma.calendario_sede.create({
      data: { ...datos, id_sede, id_calendario },
    });
  }

  // update y delete no incluyen la fecha: con include, Prisma abre una
  // transacción y suma tres idas a la base. El servicio la busca aparte.
  async update(
    id_calendario_sede: number,
    id_sede: number,
    datos: DatosExcepcion,
  ): Promise<calendario_sede> {
    return this.prisma.calendario_sede.update({
      where: { id_calendario_sede, id_sede },
      data: datos,
    });
  }

  async delete(
    id_calendario_sede: number,
    id_sede: number,
  ): Promise<calendario_sede> {
    return this.prisma.calendario_sede.delete({
      where: { id_calendario_sede, id_sede },
    });
  }
}
