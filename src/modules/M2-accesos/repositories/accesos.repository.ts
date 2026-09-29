import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma-service/prisma.service';
import { Prisma, RegistroAcceso } from '@prisma/client';

@Injectable()
export class AccesosRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra un nuevo ingreso físico a una sede.
   */
  async crearIngreso(
    id_usuario: number,
    id_sede: number,
  ): Promise<RegistroAcceso> {
    return this.prisma.registroAcceso.create({
      data: {
        id_usuario,
        id_sede,
        fecha_ingreso: new Date(),
      },
    });
  }

  /**
   * Busca si el usuario posee un ingreso activo en alguna sede (fecha_egreso es NULL).
   */
  async buscarAccesoActivoPorUsuario(id_usuario: number) {
    return this.prisma.registroAcceso.findFirst({
      where: {
        id_usuario,
        fecha_egreso: null,
      },
      include: {
        sede: true,
      },
    });
  }

  /**
   * Registra el cierre de egreso/salida del usuario en la sede.
   */
  async cerrarEgreso(id_registro_acceso: number): Promise<RegistroAcceso> {
    return this.prisma.registroAcceso.update({
      where: { id_registro_acceso },
      data: {
        fecha_egreso: new Date(),
      },
    });
  }

  /**
   * Consulta transaccional para evitar condiciones de carrera en ingresos simultáneos.
   */
  async ejecutarTransaccionIngreso<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      return fn(tx);
    });
  }
}
