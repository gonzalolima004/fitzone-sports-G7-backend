import { Injectable } from '@nestjs/common';
import { Prisma, calendario } from '@prisma/client';
import { PrismaService } from '../../../database/prisma-service/prisma.service';

/**
 * Calendario general de la cadena: fechas con su descripción y si son feriado
 * o día hábil. Cada método hace una sola consulta a la base.
 */
@Injectable()
export class CalendarioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(desde?: Date, hasta?: Date): Promise<calendario[]> {
    return this.prisma.calendario.findMany({
      where: desde || hasta ? { fecha: { gte: desde, lte: hasta } } : {},
      orderBy: { fecha: 'asc' },
    });
  }

  async findById(id_calendario: number): Promise<calendario | null> {
    return this.prisma.calendario.findUnique({ where: { id_calendario } });
  }

  async create(data: Prisma.calendarioCreateInput): Promise<calendario> {
    return this.prisma.calendario.create({ data });
  }

  async update(
    id_calendario: number,
    data: Prisma.calendarioUpdateInput,
  ): Promise<calendario> {
    return this.prisma.calendario.update({ where: { id_calendario }, data });
  }

  async delete(id_calendario: number): Promise<calendario> {
    return this.prisma.calendario.delete({ where: { id_calendario } });
  }
}
