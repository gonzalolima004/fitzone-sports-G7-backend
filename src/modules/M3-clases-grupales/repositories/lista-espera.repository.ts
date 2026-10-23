import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma-service/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ListaEsperaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async crearInscripcion(
    id_clase: number,
    id_usuario: number,
    fecha_inicio: Date,
    fecha_fin: Date,
    tx?: Prisma.TransactionClient,
  ) {
    const prismaClient = tx || this.prisma;
    return await prismaClient.claseListaEspera.create({
      data: {
        id_clase,
        id_usuario,
        fecha_inicio,
        fecha_fin,
        id_clase_lista_espera_estado: 1, // 1 = En espera
      },
    });
  }

  async existeInscripcionActiva(
    id_clase: number,
    id_usuario: number,
    fecha_inicio: Date,
    fecha_fin: Date,
    tx?: Prisma.TransactionClient,
  ) {
    const prismaClient = tx || this.prisma;
    return await prismaClient.claseListaEspera.findFirst({
      where: {
        id_clase,
        id_usuario,
        fecha_inicio,
        fecha_fin,
        id_clase_lista_espera_estado: 1, // En espera
      },
    });
  }

  async contarInscriptosActivos(
    id_clase: number,
    fecha_inicio: Date,
    fecha_fin: Date,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const prismaClient = tx || this.prisma;
    return await prismaClient.claseListaEspera.count({
      where: {
        id_clase,
        fecha_inicio,
        fecha_fin,
        id_clase_lista_espera_estado: 1, // En espera
      },
    });
  }

  async obtenerPrimerInscriptoActivo(
    id_clase: number,
    fecha_inicio: Date,
    fecha_fin: Date,
    tx?: Prisma.TransactionClient,
  ) {
    const prismaClient = tx || this.prisma;
    return await prismaClient.claseListaEspera.findFirst({
      where: {
        id_clase,
        fecha_inicio,
        fecha_fin,
        id_clase_lista_espera_estado: 1, // En espera
      },
      orderBy: {
        id_clase_lista_espera: 'asc',
      },
    });
  }

  async actualizarEstadoInscripcion(
    id_clase_lista_espera: number,
    id_estado: number,
    tx?: Prisma.TransactionClient,
  ) {
    const prismaClient = tx || this.prisma;
    return await prismaClient.claseListaEspera.update({
      where: { id_clase_lista_espera },
      data: { id_clase_lista_espera_estado: id_estado },
    });
  }

  /**
   * Obtiene las inscripciones en lista de espera de un usuario, con filtro opcional de fechas.
   */
  async obtenerInscripcionesPorUsuario(
    id_usuario: number,
    fechaInicioDia?: Date,
    fechaFinDia?: Date,
  ) {
    const whereClause: Prisma.ClaseListaEsperaWhereInput = {
      id_usuario,
      id_clase_lista_espera_estado: 1, // Solo inscripciones activas
    };

    if (fechaInicioDia && fechaFinDia) {
      whereClause.fecha_inicio = {
        gte: fechaInicioDia,
        lte: fechaFinDia,
      };
    }

    return await this.prisma.claseListaEspera.findMany({
      where: whereClause,
      include: {
        clase_lista_espera_estado: true,
        clase: {
          select: {
            id_clase: true,
            nombre: true,
          },
        },
      },
      orderBy: {
        fecha_inicio: 'asc',
      },
    });
  }

  /**
   * Obtiene la posición o turno en la cola de espera de una inscripción.
   */
  async obtenerPosicionEnCola(
    id_clase: number,
    fecha_inicio: Date,
    fecha_fin: Date,
    id_clase_lista_espera: number,
  ): Promise<number> {
    return await this.prisma.claseListaEspera.count({
      where: {
        id_clase,
        fecha_inicio,
        fecha_fin,
        id_clase_lista_espera_estado: 1,
        id_clase_lista_espera: {
          lte: id_clase_lista_espera,
        },
      },
    });
  }
}
