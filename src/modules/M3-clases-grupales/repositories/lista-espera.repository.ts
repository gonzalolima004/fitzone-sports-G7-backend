import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma-service/prisma.service';

@Injectable()
export class ListaEsperaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async crearInscripcion(
    id_clase: number,
    id_usuario: number,
    fecha_inicio: Date,
    fecha_fin: Date,
  ) {
    return await this.prisma.claseListaEspera.create({
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
  ) {
    return await this.prisma.claseListaEspera.findFirst({
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
  ): Promise<number> {
    return await this.prisma.claseListaEspera.count({
      where: {
        id_clase,
        fecha_inicio,
        fecha_fin,
        id_clase_lista_espera_estado: 1, // En espera
      },
    });
  }
}
