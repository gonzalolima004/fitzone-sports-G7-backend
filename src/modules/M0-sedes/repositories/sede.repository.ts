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
}
