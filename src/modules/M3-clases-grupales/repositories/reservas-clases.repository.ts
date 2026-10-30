import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma-service/prisma.service';
import { CrearReservaClaseDto } from '../dto/crear-reserva-clase.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReservasClasesRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cuenta cuántas reservas hay confirmadas para una clase en un bloque horario exacto.
   * Soporta ejecución dentro de una transacción para evitar condiciones de carrera (Race Conditions).
   */
  async contarReservasConfirmadas(
    id_clase: number,
    fecha_inicio: Date,
    fecha_fin: Date,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const prismaClient = tx || this.prisma;

    return await prismaClient.claseReserva.count({
      where: {
        id_clase,
        fecha_inicio,
        fecha_fin,
        id_clase_reserva_estado: 1, // Asumiendo que 1 representa el estado "Confirmada"
      },
    });
  }

  /**
   * Crea físicamente la fila en la tabla clase_reserva.
   * Soporta ejecución dentro de una transacción.
   */
  async crearReserva(
    data: CrearReservaClaseDto,
    id_usuario: number,
    id_estado: number = 1,
    tx?: Prisma.TransactionClient,
  ) {
    const prismaClient = tx || this.prisma;

    return await prismaClient.claseReserva.create({
      data: {
        id_clase: data.id_clase,
        id_usuario: id_usuario,
        id_clase_reserva_estado: id_estado,
        fecha_inicio: new Date(data.fecha_inicio),
        fecha_fin: new Date(data.fecha_fin),
      },
    });
  }

  /**
   * Obtiene una reserva por su ID.
   */
  async obtenerReservaPorId(id_clase_reserva: number) {
    return await this.prisma.claseReserva.findUnique({
      where: { id_clase_reserva },
    });
  }

  /**
   * Actualiza el estado de una reserva existente.
   */
  async actualizarEstadoReserva(
    id_clase_reserva: number,
    id_estado: number,
    tx?: Prisma.TransactionClient,
  ) {
    const prismaClient = tx || this.prisma;
    return await prismaClient.claseReserva.update({
      where: { id_clase_reserva },
      data: { id_clase_reserva_estado: id_estado },
    });
  }

  async obtenerPrimerEnEspera(
    id_clase: number,
    fecha_inicio: Date,
    fecha_fin: Date,
    tx?: Prisma.TransactionClient,
    toleranciaMs: number = 60000,
  ) {
    const prismaClient = tx || this.prisma;
    const inicioDate = new Date(fecha_inicio);
    const finDate = new Date(fecha_fin);

    const where: Prisma.ClaseReservaWhereInput = {
      id_clase,
      id_clase_reserva_estado: 2, // 2 = En Espera
    };

    if (toleranciaMs > 0) {
      where.fecha_inicio = {
        gte: new Date(inicioDate.getTime() - toleranciaMs),
        lte: new Date(inicioDate.getTime() + toleranciaMs),
      };
      where.fecha_fin = {
        gte: new Date(finDate.getTime() - toleranciaMs),
        lte: new Date(finDate.getTime() + toleranciaMs),
      };
    } else {
      where.fecha_inicio = inicioDate;
      where.fecha_fin = finDate;
    }

    return await prismaClient.claseReserva.findFirst({
      where,
      orderBy: {
        id_clase_reserva: 'asc', // El primero que llegó (auto-incremental)
      },
    });
  }

  /**
   * Obtiene las reservas asociadas a un usuario, permitiendo filtrar por un rango de fechas.
   * Filtra únicamente las reservas activas/confirmadas (id_clase_reserva_estado: 1).
   */
  async obtenerReservasPorUsuario(
    id_usuario: number,
    fechaInicioDia?: Date,
    fechaFinDia?: Date,
  ) {
    const whereClause: Prisma.ClaseReservaWhereInput = {
      id_usuario,
      id_clase_reserva_estado: 1, // Solo reservas activas / confirmadas
    };

    if (fechaInicioDia && fechaFinDia) {
      whereClause.fecha_inicio = {
        gte: fechaInicioDia,
        lte: fechaFinDia,
      };
    }

    return await this.prisma.claseReserva.findMany({
      where: whereClause,
      include: {
        clase_reserva_estado: true,
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
}
