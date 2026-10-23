import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma-service/prisma.service';
import { CreateClaseDto } from '../dto/create-clase.dto';
import { UpdateClaseDto } from '../dto/update-clase.dto';

@Injectable()
export class ClasesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async crearClase(data: CreateClaseDto) {
    const { fecha, ...resto } = data;
    return await this.prisma.clase.create({
      data: {
        ...resto,
        ...(fecha !== undefined
          ? { fecha: fecha ? new Date(fecha) : null }
          : {}),
      },
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
    const { fecha, ...resto } = data;
    return await this.prisma.clase.update({
      where: {
        id_clase,
      },
      data: {
        ...resto,
        ...(fecha !== undefined
          ? { fecha: fecha ? new Date(fecha) : null }
          : {}),
      },
    });
  }

  async reemplazarClase(id_clase: number, data: CreateClaseDto) {
    const { fecha, ...resto } = data;
    return await this.prisma.clase.update({
      where: {
        id_clase,
      },
      data: {
        ...resto,
        ...(fecha !== undefined
          ? { fecha: fecha ? new Date(fecha) : null }
          : {}),
      },
    });
  }

  async darDeBajaClase(id_clase: number, tx?: Prisma.TransactionClient) {
    const prismaClient = tx || this.prisma;
    return await prismaClient.clase.update({
      where: {
        id_clase,
      },
      data: {
        activo: false,
      },
    });
  }

  async cancelarReservasFuturas(
    id_clase: number,
    fechaDesde: Date,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const prismaClient = tx || this.prisma;
    const resultado = await prismaClient.claseReserva.updateMany({
      where: {
        id_clase,
        fecha_inicio: {
          gte: fechaDesde,
        },
        id_clase_reserva_estado: {
          in: [1, 2], // 1 = Confirmada, 2 = En Espera
        },
      },
      data: {
        id_clase_reserva_estado: 4, // 4 = Cancelada
      },
    });

    return resultado.count;
  }
}
