import { Injectable } from '@nestjs/common';
import { Prisma, sede_horario } from '@prisma/client';
import { PrismaService } from '../../../database/prisma-service/prisma.service';

/**
 * Horario semanal de cada sede (un registro por día). Cada método hace una
 * sola consulta: la sede la valida la clave foránea y el "un horario por
 * día", la restricción única.
 */
@Injectable()
export class SedeHorarioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySede(id_sede: number): Promise<sede_horario[]> {
    return this.prisma.sede_horario.findMany({
      where: { id_sede },
      orderBy: { dia_semana: 'asc' },
    });
  }

  async findById(
    id_sede_horario: number,
    id_sede: number,
  ): Promise<sede_horario | null> {
    return this.prisma.sede_horario.findFirst({
      where: { id_sede_horario, id_sede },
    });
  }

  async create(
    data: Prisma.sede_horarioUncheckedCreateInput,
  ): Promise<sede_horario> {
    return this.prisma.sede_horario.create({ data });
  }

  async update(
    id_sede_horario: number,
    id_sede: number,
    data: Prisma.sede_horarioUncheckedUpdateInput,
  ): Promise<sede_horario> {
    return this.prisma.sede_horario.update({
      where: { id_sede_horario, id_sede },
      data,
    });
  }

  async delete(
    id_sede_horario: number,
    id_sede: number,
  ): Promise<sede_horario> {
    return this.prisma.sede_horario.delete({
      where: { id_sede_horario, id_sede },
    });
  }
}
