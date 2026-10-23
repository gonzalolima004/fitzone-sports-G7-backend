import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma-service/prisma.service';
import { Prisma, Sede } from '@prisma/client';

@Injectable()
export class SedeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllActive(): Promise<Sede[]> {
    return this.prisma.sede.findMany({
      where: {
        activo: true,
      },
    });
  }

  async findById(id_sede: number): Promise<Sede | null> {
    return this.prisma.sede.findUnique({
      where: {
        id_sede,
      },
    });
  }

  async create(data: Prisma.SedeUncheckedCreateInput): Promise<Sede> {
    return this.prisma.sede.create({
      data,
    });
  }

  async update(
    id_sede: number,
    data: Prisma.SedeUncheckedUpdateInput,
  ): Promise<Sede> {
    return this.prisma.sede.update({
      where: { id_sede },
      data,
    });
  }

  async logicalDelete(id_sede: number): Promise<Sede> {
    return this.prisma.sede.update({
      where: { id_sede },
      data: { activo: false },
    });
  }

  /**
   * Consulta la excepción de calendario y el horario semanal de la sede
   */
  async findHorarioOperativo(id_sede: number, dia_semana: number, fecha: Date) {
    //Refactorización para hacer ambas consultas a la vez para que funcione mas rapido
    const [excepcion, horarioBase] = await Promise.all([
      this.prisma.calendario_sede.findFirst({
        where: {
          id_sede,
          calendario: {
            fecha,
          },
        },
        include: {
          calendario: true,
        },
      }),
      this.prisma.sede_horario.findFirst({
        where: {
          id_sede,
          dia_semana,
        },
      }),
    ]);

    // 1. Verificar si hay excepción para esa fecha específica (feriado o cierre)
    /*const excepcion = await this.prisma.calendario_sede.findFirst({
      where: {
        id_sede,
        calendario: {
          fecha,
        },
      },
      include: {
        calendario: true,
      },
    });

    // 2. Obtener el horario base semanal de la sede para el día (0 = Domingo, ..., 6 = Sábado)
    const horarioBase = await this.prisma.sede_horario.findFirst({
      where: {
        id_sede,
        dia_semana,
      },
    });*/

    return { excepcion, horarioBase };
  }
}
