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
import { ListaEsperaSubject } from '../patterns/observer/lista-espera.subject';

@Injectable()
export class ReservasClasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reservasRepository: ReservasClasesRepository,
    private readonly listaEsperaSubject: ListaEsperaSubject,
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

  async cancelarReserva(id_clase_reserva: number, id_usuario: number) {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Obtener la reserva original
      const reserva = await tx.claseReserva.findUnique({
        where: { id_clase_reserva },
      });

      if (!reserva) {
        throw new NotFoundException('Reserva no encontrada');
      }

      if (reserva.id_usuario !== id_usuario) {
        throw new ForbiddenException(
          'No puedes cancelar una reserva que no es tuya',
        );
      }

      if (reserva.id_clase_reserva_estado !== 1) {
        throw new BadRequestException(
          'La reserva no está en estado confirmada',
        );
      }

      // 2. Marcar como cancelada (ej. estado 4)
      await this.reservasRepository.actualizarEstadoReserva(
        id_clase_reserva,
        4, // Cancelada
        tx,
      );

      // 3. Buscar si hay alguien en lista de espera (estado 2) para esa clase y horario exacto
      const primerEnEspera =
        await this.reservasRepository.obtenerPrimerEnEspera(
          reserva.id_clase,
          reserva.fecha_inicio,
          reserva.fecha_fin,
          tx,
        );

      // 4. Si hay alguien, se promueve y se notifica
      if (primerEnEspera) {
        // Promover a Confirmada (estado 1)
        await this.reservasRepository.actualizarEstadoReserva(
          primerEnEspera.id_clase_reserva,
          1,
          tx,
        );

        // Disparar evento a los observadores
        await this.listaEsperaSubject.notify({
          id_clase: reserva.id_clase,
          fecha_inicio: reserva.fecha_inicio,
          fecha_fin: reserva.fecha_fin,
          id_usuario_promovido: primerEnEspera.id_usuario,
        });
      }

      return {
        message: 'Reserva cancelada exitosamente',
        cupo_reasignado: !!primerEnEspera,
      };
    });
  }
}
