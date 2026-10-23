import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma-service/prisma.service';
import { ReservasClasesRepository } from '../repositories/reservas-clases.repository';
import { ListaEsperaRepository } from '../repositories/lista-espera.repository';
import { CrearReservaClaseDto } from '../dto/crear-reserva-clase.dto';
import { ListaEsperaSubject } from '../patterns/observer/lista-espera.subject';
import { CancelarReservaResponseDto } from '../dto/cancelar-reserva-response.dto';
import { Subject } from 'rxjs';
import {
  claseAplicaEnFecha,
  obtenerRangoDiaArgentina,
} from '../../../common/utils/date-time.util';

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
    private readonly listaEsperaSubject: ListaEsperaSubject,
    private readonly listaEsperaRepository: ListaEsperaRepository,
  ) {}

  async crearReserva(data: CrearReservaClaseDto, id_usuario: number) {
    const fechaInicio = new Date(data.fecha_inicio);
    const fechaFin = new Date(data.fecha_fin);
    const ahora = new Date();

    if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
      throw new BadRequestException(
        'Las fechas proporcionadas no son válidas.',
      );
    }

    if (fechaFin <= fechaInicio) {
      throw new BadRequestException(
        'La fecha de fin debe ser posterior a la fecha de inicio.',
      );
    }

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

      const fechaReservaStr = data.fecha_inicio.slice(0, 10);
      if (!claseAplicaEnFecha(clase, fechaReservaStr)) {
        throw new BadRequestException(
          'La clase no se dicta en el día o fecha seleccionada.',
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
    id_clase_reserva: number,
    id_usuario: number,
  ): Promise<CancelarReservaResponseDto> {
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

      const ahora = new Date();
      const fechaInicio = new Date(reserva.fecha_inicio);

      if (ahora >= fechaInicio) {
        throw new BadRequestException(
          'No se puede cancelar una clase que ya comenzó o finalizó.',
        );
      }

      // Calcular diferencia en horas: penalidad si faltan menos de 2 horas
      const diffHoras =
        (fechaInicio.getTime() - ahora.getTime()) / (1000 * 60 * 60);
      const penalidadAplicada = diffHoras < 2;

      // 2. Marcar como cancelada (ej. estado 4)
      const reservaCancelada =
        await this.reservasRepository.actualizarEstadoReserva(
          id_clase_reserva,
          4, // Cancelada
          tx,
        );

      // 3. Buscar si hay alguien en lista de espera para esa clase y horario exacto
      // Prioridad 1: Tabla oficial clase_lista_espera
      let idUsuarioPromovido: number | null = null;
      const primerInscriptoLista =
        await this.listaEsperaRepository.obtenerPrimerInscriptoActivo(
          reserva.id_clase,
          reserva.fecha_inicio,
          reserva.fecha_fin,
          tx,
        );

      if (primerInscriptoLista) {
        idUsuarioPromovido = primerInscriptoLista.id_usuario;
        // Creamos la nueva reserva confirmada para el socio promovido
        await this.reservasRepository.crearReserva(
          {
            id_clase: reserva.id_clase,
            fecha_inicio: reserva.fecha_inicio.toISOString(),
            fecha_fin: reserva.fecha_fin.toISOString(),
          },
          idUsuarioPromovido,
          1, // Confirmada
          tx,
        );
        // Actualizamos estado en lista de espera (2 = Promovida / Procesada)
        await this.listaEsperaRepository.actualizarEstadoInscripcion(
          primerInscriptoLista.id_clase_lista_espera,
          2,
          tx,
        );
      } else {
        // Fallback: buscar si existía en clase_reserva con estado 2 (En Espera)
        const primerEnEsperaReserva =
          await this.reservasRepository.obtenerPrimerEnEspera(
            reserva.id_clase,
            reserva.fecha_inicio,
            reserva.fecha_fin,
            tx,
          );

        if (primerEnEsperaReserva) {
          idUsuarioPromovido = primerEnEsperaReserva.id_usuario;
          await this.reservasRepository.actualizarEstadoReserva(
            primerEnEsperaReserva.id_clase_reserva,
            1,
            tx,
          );
        }
      }

      // 4. Si se promovió a alguien, notificar a los observadores
      if (idUsuarioPromovido) {
        await this.listaEsperaSubject.notify({
          id_clase: reserva.id_clase,
          fecha_inicio: reserva.fecha_inicio,
          fecha_fin: reserva.fecha_fin,
          id_usuario_promovido: idUsuarioPromovido,
        });
      }

      return {
        penalidadAplicada,
        mensaje: penalidadAplicada
          ? 'Reserva cancelada con penalidad (fuera de término, menos de 2 horas de anticipación).'
          : 'Reserva cancelada exitosamente sin penalidad.',
        reserva: reservaCancelada,
        cupo_reasignado: idUsuarioPromovido !== null,
      };
    });
  }

  async obtenerMisReservas(id_usuario: number, fecha?: string) {
    let inicioDia: Date | undefined;
    let finDia: Date | undefined;

    if (fecha) {
      const rango = obtenerRangoDiaArgentina(fecha);
      inicioDia = rango.inicioDia;
      finDia = rango.finDia;
    }

    const reservas = await this.reservasRepository.obtenerReservasPorUsuario(
      id_usuario,
      inicioDia,
      finDia,
    );

    return reservas.map((r) => ({
      id_clase_reserva: r.id_clase_reserva,
      id_clase: r.id_clase,
      id_usuario: r.id_usuario,
      fecha_inicio: r.fecha_inicio.toISOString(),
      fecha_fin: r.fecha_fin.toISOString(),
      id_clase_reserva_estado: r.id_clase_reserva_estado,
      estado:
        r.clase_reserva_estado?.descripcion?.toUpperCase() ||
        (r.id_clase_reserva_estado === 1 ? 'CONFIRMADA' : 'CANCELADA'),
      nombre_clase: r.clase?.nombre,
    }));
  }
}
