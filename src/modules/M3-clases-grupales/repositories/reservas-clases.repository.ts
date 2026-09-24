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
  ) {
    const prismaClient = tx || this.prisma;
    return await prismaClient.claseReserva.findFirst({
      where: {
        id_clase,
        fecha_inicio,
        fecha_fin,
        id_clase_reserva_estado: 2, // 2 = En Espera
      },
      orderBy: {
        id_clase_reserva: 'asc', // El primero que llegó (auto-incremental)
      },
    });
  }
}
