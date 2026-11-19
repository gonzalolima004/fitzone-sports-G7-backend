import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma-service/prisma.service';
import { Prisma, RegistroAcceso } from '@prisma/client';

export type RegistroAccesoConSede = Prisma.RegistroAccesoGetPayload<{
  include: { sede: true };
}>;

@Injectable()
export class AccesosRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra la entrada del socio asignando la fecha/hora actual.
   * Permite recibir el cliente de transacción opcional para ejecutarse dentro del bloque $transaction.
   */
  async crearIngreso(
    id_usuario: number,
    id_sede: number,
    tx?: Prisma.TransactionClient,
  ): Promise<RegistroAcceso> {
    const client = tx ?? this.prisma;
    return client.registroAcceso.create({
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
  async buscarAccesoActivoPorUsuario(
    id_usuario: number,
    tx?: Prisma.TransactionClient,
  ): Promise<RegistroAccesoConSede | null> {
    const client = tx ?? this.prisma;
    return client.registroAcceso.findFirst({
      where: {
        id_usuario,
        fecha_egreso: null,
      },
      include: {
        sede: true,
      },
      orderBy: {
        fecha_ingreso: 'desc',
      },
    });
  }

  /**
   * Registra el cierre de egreso/salida del usuario en la sede.
   */
  async cerrarEgreso(
    id_registro_acceso: number,
    fechaEgreso?: Date,
    tx?: Prisma.TransactionClient,
  ): Promise<RegistroAcceso> {
    const client = tx ?? this.prisma;
    return client.registroAcceso.update({
      where: { id_registro_acceso },
      data: {
        fecha_egreso: fechaEgreso ?? new Date(),
      },
    });
  }

  /**
   * Consulta transaccional para evitar condiciones de carrera en ingresos simultáneos.
   */
  async ejecutarTransaccionIngreso<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      return fn(tx);
    });
  }

  /**
   * Cuenta el número de accesos activos en una sede específica.
   * Acepta un cliente transaccional opcional para ejecutarse dentro de $transaction.
   */
  async contarAforoActual(
    idSede: number,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const client = tx ?? this.prisma;
    return client.registroAcceso.count({
      where: {
        id_sede: idSede,
        fecha_egreso: null,
      },
    });
  }

  /**
   * Obtiene el aforo máximo de una sede específica.
   * Acepta un cliente transaccional opcional para ejecutarse dentro de $transaction.
   */
  async obtenerAforoMaximoSede(
    idSede: number,
    tx?: Prisma.TransactionClient,
  ): Promise<number | null> {
    const client = tx ?? this.prisma;
    try {
      const sede = await client.sede.findUnique({
        where: { id_sede: idSede },
        select: { aforo_maximo: true },
      });
      return sede ? sede.aforo_maximo : null;
    } catch (error) {
      console.error('Error al consultar aforo máximo en base de datos:', error);
      return null;
    }
  }

  /**
   * Busca una sede por su ID, incluyendo los datos de su ciudad.
   */
  async buscarSedePorId(id_sede: number, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.sede.findUnique({
      where: { id_sede },
      include: {
        ciudad: true,
      },
    });
  }
}
