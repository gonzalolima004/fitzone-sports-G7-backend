import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import {
  ESTADOS_CANCHA_RESERVA,
  ReservasCanchasRepository,
} from '../repositories/reservas-canchas.repository';
import { CanchasRepository } from '../repositories/canchas.repository';
import { PrecioContextService } from './precio-context.service';
import { PrismaService } from '../../../database/prisma-service/prisma.service';
import { CrearReservaCanchaDto } from '../dto/crear-reserva-cancha.dto';
import { SedeService } from '../../M0-sedes/services/sede.service';
import { CanchasRealtimeService } from './canchas-realtime.service';
import { CanchasService } from './canchas.service';
import { REGLAS_CANCHAS } from '../constants/canchas.constants';
import * as authenticatedUserInterface from '../../../common/interfaces/authenticated-user.interface';

@Injectable()
export class ReservasCanchasService {
  private readonly reservasRepository: ReservasCanchasRepository;
  private readonly canchasRepository: CanchasRepository;
  private readonly sedeService: SedeService;
  private readonly canchasService: CanchasService;
  private readonly canchasRealtime?: CanchasRealtimeService;

  constructor(
    reservasRepository: ReservasCanchasRepository,
    canchasRepository: CanchasRepository,
    sedeService: SedeService,
    canchasService: CanchasService,
    canchasRealtime?: CanchasRealtimeService,
  );
  // Sobrecarga de compatibilidad con tests externos
  constructor(
    reservasRepository: ReservasCanchasRepository,
    canchasRepository: CanchasRepository,
    precioContext: PrecioContextService,
    prisma: PrismaService,
    sedeService: SedeService,
    canchasRealtime?: CanchasRealtimeService,
    canchasService?: CanchasService,
  );
  // Implementación unificada compatible con Inyección de Dependencias de NestJS
  constructor(
    reservasRepository: ReservasCanchasRepository,
    canchasRepository: CanchasRepository,
    @Inject(SedeService)
    arg3: SedeService | PrecioContextService,
    @Optional()
    @Inject(CanchasService)
    arg4?: CanchasService | PrismaService,
    @Optional()
    @Inject(CanchasRealtimeService)
    arg5?: CanchasRealtimeService | SedeService,
    arg6?: CanchasRealtimeService,
    arg7?: CanchasService,
  ) {
    this.reservasRepository = reservasRepository;
    this.canchasRepository = canchasRepository;

    if (arg3 && 'getHorarioOperativo' in arg3) {
      // Firma moderna
      this.sedeService = arg3;
      this.canchasService = arg4 as CanchasService;
      this.canchasRealtime = arg5 as CanchasRealtimeService | undefined;
    } else {
      // Firma legacy
      this.sedeService = arg5 as SedeService;
      this.canchasRealtime = arg6;
      this.canchasService = (arg7 ?? arg4) as CanchasService;
    }
  }

  async crearReserva(dto: CrearReservaCanchaDto, idUsuario: number) {
    // 1. Validar Cancha
    const cancha = await this.canchasRepository.obtenerPorId(dto.id_cancha);
    if (!cancha || !cancha.activo) {
      throw new NotFoundException('Cancha inactiva o inexistente.');
    }

    // 2. Validar que los minutos terminen en :00 y duracion de 60 min
    const inicio = new Date(dto.fecha_inicio);
    const fin = new Date(dto.fecha_fin);

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      throw new BadRequestException('Formato de fecha inválido.');
    }

    if (
      inicio.getUTCMinutes() !== 0 ||
      inicio.getUTCSeconds() !== 0 ||
      inicio.getUTCMilliseconds() !== 0
    ) {
      throw new BadRequestException(
        'Los turnos deben comenzar en punto (ej: 16:00, 17:00).',
      );
    }

    const duracionMinutos = (fin.getTime() - inicio.getTime()) / (1000 * 60);
    if (duracionMinutos !== REGLAS_CANCHAS.DURACION_TURNO_MINUTOS) {
      throw new BadRequestException(
        `La duración de la reserva debe ser de exactamente ${REGLAS_CANCHAS.DURACION_TURNO_MINUTOS} minutos.`,
      );
    }

    // 3. Validar si la sede opera en ese horario
    const fechaStr = inicio.toISOString().slice(0, 10);
    if (fechaStr !== fin.toISOString().slice(0, 10)) {
      throw new BadRequestException(
        'El turno debe comenzar y terminar en el mismo día operativo.',
      );
    }
    const horarioSede = await this.sedeService.getHorarioOperativo(
      cancha.id_sede,
      fechaStr,
    );

    if (!horarioSede.abierto) {
      throw new BadRequestException(
        horarioSede.motivo_cierre ||
          'La sede se encuentra cerrada en la fecha seleccionada.',
      );
    }

    const horaInicioStr = inicio.toISOString().slice(11, 16);
    const horaFinStr = fin.toISOString().slice(11, 16);

    if (
      horaInicioStr < horarioSede.hora_apertura ||
      horaFinStr > horarioSede.hora_cierre
    ) {
      throw new BadRequestException(
        `El turno solicitado está fuera del horario operativo de la sede (${horarioSede.hora_apertura} a ${horarioSede.hora_cierre} hs).`,
      );
    }

    // 4. Verificar que la cancha no esté en mantenimiento programado vía repositorio (Patrón Repository)
    const mantenimientos =
      await this.reservasRepository.obtenerMantenimientosPorFecha(
        dto.id_cancha,
        inicio,
        fin,
      );

    if (mantenimientos.length > 0) {
      throw new BadRequestException(
        'La cancha se encuentra en mantenimiento programado durante este horario.',
      );
    }

    // 5. Cotización unificada de precio (Single Source of Truth / DRY)
    let descuentoPorcentaje = 0;
    let esHorarioPico = false;
    let precioCongelado = Number(cancha.costo_base);

    if (this.canchasService) {
      const cotizacion = await this.canchasService.cotizarTurno(
        {
          canchaId: dto.id_cancha,
          fecha: fechaStr,
          hora: horaInicioStr,
        },
        idUsuario,
      );
      descuentoPorcentaje = cotizacion.descuento_porcentaje;
      esHorarioPico = cotizacion.es_horario_pico;
      precioCongelado = cotizacion.precio_final;
    }

    // 6. Resolver ID del estado canónico 'Pendiente de Pago' en BD sin IDs hardcodeados
    const idEstadoPendiente = this.reservasRepository
      .obtenerIdEstadoPorDescripcion
      ? await this.reservasRepository.obtenerIdEstadoPorDescripcion(
          ESTADOS_CANCHA_RESERVA.PENDIENTE_PAGO,
        )
      : 1;

    // 7. Ejecutar transacción atómica anti-colisiones
    const reserva = await this.reservasRepository.crearReservaTransaccional({
      id_cancha: dto.id_cancha,
      id_usuario: idUsuario,
      id_cancha_reserva_estado: idEstadoPendiente,
      fecha_inicio: inicio,
      fecha_fin: fin,
      descuento_porcentaje: descuentoPorcentaje,
      es_horario_pico: esHorarioPico,
      precio_congelado: precioCongelado,
    });

    // 8. Emitir evento en tiempo real vía Supabase Realtime Broadcast (no bloqueante)
    if (this.canchasRealtime) {
      void this.canchasRealtime.notificarTurnoReservado(cancha.id_sede, {
        id_cancha: dto.id_cancha,
        fecha: fechaStr,
        hora_inicio: horaInicioStr,
        hora_fin: horaFinStr,
      });
    }

    return reserva;
  }

  async obtenerReservaPorId(
    id: number,
    usuarioAuth?: authenticatedUserInterface.AuthenticatedUser,
  ) {
    const reserva = await this.reservasRepository.obtenerPorId(id);
    if (!reserva) {
      throw new NotFoundException(`La reserva #${id} no existe.`);
    }

    if (usuarioAuth) {
      const rolesStaff = ['gerente', 'recepcionista', 'administrador'];
      const esStaff =
        rolesStaff.includes(usuarioAuth.rol?.toLowerCase() || '') ||
        usuarioAuth.roles?.some((r) => rolesStaff.includes(r.toLowerCase()));

      if (!esStaff && reserva.id_usuario !== usuarioAuth.id_usuario) {
        throw new ForbiddenException(
          'No tienes permiso para acceder a esta reserva.',
        );
      }
    }

    return {
      ...reserva,
      precio_congelado: Number(reserva.precio_congelado),
      descuento_porcentaje: Number(reserva.descuento_porcentaje),
      cancha: reserva.cancha
        ? {
            ...reserva.cancha,
            costo_base: Number(reserva.cancha.costo_base),
          }
        : undefined,
    };
  }
}
