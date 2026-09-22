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
import { CancelarReservaResponseDto } from '../dto/cancelar-reserva-response.dto';
import { Subject } from 'rxjs';

@Injectable()
export class ReservasClasesService {
  // Sujeto Observer para notificar cuando se libera una vacante por cancelación
  public readonly vacanteNotifier = new Subject<{
    id_clase: number;
    id_clase_reserva: number;
  }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly reservasRepository: ReservasClasesRepository,
  ) {}

  async crearReserva(data: CrearReservaClaseDto, id_usuario: number) {
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
        id_usuario: id_usuario,
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
        id_usuario: id_usuario,
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
      return await this.reservasRepository.crearReserva(
        data,
        id_usuario,
        1,
        tx,
      );
    });
  }

  async cancelarReserva(
    id_reserva: number,
    id_usuario: number,
  ): Promise<CancelarReservaResponseDto> {
    const reserva =
      await this.reservasRepository.obtenerReservaPorId(id_reserva);

    if (!reserva) {
      throw new NotFoundException(`La reserva con ID ${id_reserva} no existe.`);
    }

    if (reserva.id_usuario !== id_usuario) {
      throw new ForbiddenException(
        'No tienes permiso para cancelar esta reserva.',
      );
    }

    if (reserva.id_clase_reserva_estado === 2) {
      throw new BadRequestException('La reserva ya se encuentra cancelada.');
    }

    const ahora = new Date();
    const fechaInicio = new Date(reserva.fecha_inicio);

    if (ahora >= fechaInicio) {
      throw new BadRequestException(
        'No se puede cancelar una clase que ya comenzó o finalizó.',
      );
    }

    // Calcular la diferencia en horas
    const diffHoras =
      (fechaInicio.getTime() - ahora.getTime()) / (1000 * 60 * 60);

    // Si faltan menos de 2 horas, se aplica penalidad
    const penalidadAplicada = diffHoras < 2;

    // Actualizar estado a Cancelada (Asumimos ID 2)
    const reservaCancelada =
      await this.reservasRepository.actualizarEstadoReserva(id_reserva, 2);

    // Disparar el Observer para notificar que hay una vacante disponible
    this.vacanteNotifier.next({
      id_clase: reserva.id_clase,
      id_clase_reserva: reserva.id_clase_reserva,
    });

    return {
      penalidadAplicada,
      mensaje: penalidadAplicada
        ? 'Reserva cancelada con penalidad (fuera de término, menos de 2 horas de anticipación).'
        : 'Reserva cancelada exitosamente sin penalidad.',
      reserva: reservaCancelada,
    };
  }
}
