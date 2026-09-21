import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma-service/prisma.service';
import { ReservasClasesRepository } from '../repositories/reservas-clases.repository';
import { CrearReservaClaseDto } from '../dto/crear-reserva-clase.dto';

@Injectable()
export class ReservasClasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reservasRepository: ReservasClasesRepository,
  ) {}

  async crearReserva(data: CrearReservaClaseDto) {
    const fechaInicio = new Date(data.fecha_inicio);
    const fechaFin = new Date(data.fecha_fin);
    const ahora = new Date();

    // 1. Validación de hasta 48h antes del inicio
    const diffHoras =
      (fechaInicio.getTime() - ahora.getTime()) / (1000 * 60 * 60);
    if (diffHoras > 48) {
      throw new BadRequestException(
        'Solo se permiten reservas con un máximo de 48 horas de anticipación.',
      );
    }
    if (diffHoras <= 0) {
      throw new BadRequestException(
        'No se puede reservar una clase que ya comenzó.',
      );
    }

    // 2. Verificación de no mora del socio (RN-03)
    // Asumimos que tener una membresía activa (estado 1) y no vencida significa no tener mora.
    const membresiaActiva = await this.prisma.membresia.findFirst({
      where: {
        id_usuario: data.id_usuario,
        id_membresia_estado: 1,
        fecha_fin: { gte: ahora },
      },
    });

    if (!membresiaActiva) {
      throw new ForbiddenException(
        'El socio presenta mora o no tiene una membresía activa vigente (RN-03).',
      );
    }

    // 3. Verificación de no superposición horaria
    const superposicion = await this.prisma.claseReserva.findFirst({
      where: {
        id_usuario: data.id_usuario,
        id_clase_reserva_estado: 1, // 1 = Confirmada
        OR: [
          {
            // Hay superposición si la nueva clase empieza antes de que termine la existente
            // y termina después de que empiece la existente
            fecha_inicio: { lt: fechaFin },
            fecha_fin: { gt: fechaInicio },
          },
        ],
      },
    });

    if (superposicion) {
      throw new ConflictException(
        'Ya tienes una reserva confirmada que se superpone con este horario.',
      );
    }

    // 4. Validación atómica de cupo e inserción
    return await this.prisma.$transaction(async (tx) => {
      // 4.1. Validar existencia y capacidad de la clase
      const clase = await tx.clase.findUnique({
        where: { id_clase: data.id_clase },
      });

      if (!clase) {
        throw new NotFoundException(
          `La clase con ID ${data.id_clase} no existe.`,
        );
      }

      // 4.2. Contar reservas actuales
      const reservasConfirmadas =
        await this.reservasRepository.contarReservasConfirmadas(
          data.id_clase,
          fechaInicio,
          fechaFin,
          tx,
        );

      // 4.3. Verificar cupo
      if (reservasConfirmadas >= clase.capacidad_maxima) {
        throw new ConflictException(
          'El cupo máximo para esta clase ya está lleno.',
        );
      }

      // 4.4. Crear reserva
      return await this.reservasRepository.crearReserva(data, 1, tx);
    });
  }
}
