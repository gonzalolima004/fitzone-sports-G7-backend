import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReservasCanchasRepository } from '../repositories/reservas-canchas.repository';
import { CanchasRepository } from '../repositories/canchas.repository';
import { PrecioContextService } from './precio-context.service';
import { CrearReservaCanchaDto } from '../dto/crear-reserva-cancha.dto';
import { CotizacionContext } from '../dto/cotizacion-turno.dto';
import { PrismaService } from '../../../database/prisma-service/prisma.service';
import { SedeService } from '../../M0-sedes/services/sede.service';

@Injectable()
export class ReservasCanchasService {
  constructor(
    private readonly reservasRepository: ReservasCanchasRepository,
    private readonly canchasRepository: CanchasRepository,
    private readonly precioContext: PrecioContextService,
    private readonly prisma: PrismaService, // Para consultar membresía del usuario
    private readonly sedeService: SedeService,
  ) {}

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

    if (inicio.getUTCMinutes() !== 0 || inicio.getUTCSeconds() !== 0) {
      throw new BadRequestException(
        'Los turnos deben comenzar en punto (ej: 16:00, 17:00).',
      );
    }

    const duracionMinutos = (fin.getTime() - inicio.getTime()) / (1000 * 60);
    if (duracionMinutos !== 60) {
      throw new BadRequestException(
        'La duración de la reserva debe ser de exactamente 60 minutos.',
      );
    }

    // 3. Validar si la sede opera en ese horario
    const fechaStr = dto.fecha_inicio.slice(0, 10);
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

    // 4. Verificar que la cancha no esté en mantenimiento programado
    const enMantenimiento = await this.prisma.canchaMantenimiento.findFirst({
      where: {
        id_cancha: dto.id_cancha,
        fecha_inicio: { lt: fin },
        fecha_fin: { gt: inicio },
      },
    });

    if (enMantenimiento) {
      throw new BadRequestException(
        'La cancha se encuentra en mantenimiento programado durante este horario.',
      );
    }

    // 5. Validar estado del usuario (RN-03: membresía al día)
    const membresiaActiva = await this.prisma.membresia.findFirst({
      where: {
        id_usuario: idUsuario,
        id_membresia_estado: 1, // 1 = Activa
        fecha_fin: { gte: new Date() },
      },
    });

    // 6. Configurar contexto y calcular precio con Strategy
    const contextoCotizacion: CotizacionContext = {
      esSocioActivo: !!membresiaActiva,
      horaInicio: inicio,
    };

    const calculo = this.precioContext.calcularPrecioFinal(
      Number(cancha.costo_base),
      contextoCotizacion,
    );

    // 7. Ejecutar transacción atómica anti-colisiones (RN-02)
    const reserva = await this.reservasRepository.crearReservaTransaccional({
      id_cancha: dto.id_cancha,
      id_usuario: idUsuario,
      id_cancha_reserva_estado: 1, // 1 = Confirmada/Pendiente Pago
      fecha_inicio: inicio,
      fecha_fin: fin,
      descuento_porcentaje: calculo.descuento_porcentaje,
      es_horario_pico: calculo.es_horario_pico,
      precio_congelado: calculo.precio_congelado,
    });

    console.log(
      `[Realtime Broadcast] Grilla actualizada para cancha ${dto.id_cancha}`,
    );

    return reserva;
  }
}
