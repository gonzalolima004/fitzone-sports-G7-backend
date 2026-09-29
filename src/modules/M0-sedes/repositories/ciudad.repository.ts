import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma-service/prisma.service';
import { Prisma, Ciudad } from '@prisma/client';

@Injectable()
export class CiudadRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllActive(): Promise<Ciudad[]> {
    return this.prisma.ciudad.findMany({
      where: {
        activo: true,
      },
    });
  }

  async findById(id_ciudad: number): Promise<Ciudad | null> {
    return this.prisma.ciudad.findUnique({
      where: {
        id_ciudad,
      },
    });
  }

  async create(data: Prisma.CiudadUncheckedCreateInput): Promise<Ciudad> {
    return this.prisma.ciudad.create({
      data,
    });
  }

  async update(
    id_ciudad: number,
    data: Prisma.CiudadUncheckedUpdateInput,
  ): Promise<Ciudad> {
    return this.prisma.ciudad.update({
      where: {
        id_ciudad,
      },
      data,
    });
  }

  async logicalDelete(id_ciudad: number): Promise<Ciudad> {
    return this.prisma.ciudad.update({
      where: { id_ciudad },
      data: { activo: false },
    });
  }
}
