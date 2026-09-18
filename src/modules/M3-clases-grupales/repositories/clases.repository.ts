import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma-service/prisma.service';
import { CreateClaseDto } from '../dto/create-clase.dto';
import { UpdateClaseDto } from '../dto/update-clase.dto';

@Injectable()
export class ClasesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async crearClase(data: CreateClaseDto) {
    return await this.prisma.clase.create({
      data,
    });
  }

  async obtenerClasesPorSede(id_sede: number) {
    return await this.prisma.clase.findMany({
      where: {
        id_sede,
        activo: true,
      },
    });
  }

  async obtenerClasePorId(id_clase: number) {
    return await this.prisma.clase.findUnique({
      where: {
        id_clase,
      },
    });
  }

  async actualizarClase(id_clase: number, data: UpdateClaseDto) {
    return await this.prisma.clase.update({
      where: {
        id_clase,
      },
      data,
    });
  }
}
