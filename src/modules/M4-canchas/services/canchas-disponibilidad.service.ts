import { Injectable, NotFoundException } from '@nestjs/common';
import { CanchasRepository } from '../repositories/canchas.repository';
import { ReservasCanchasRepository } from '../repositories/reservas-canchas.repository';
import { SedeService } from '../../M0-sedes/services/sede.service';
import {
  DisponibilidadSlotResponseDto,
  SlotEstado,
} from '../dto/disponibilidad-slot-response.dto';
import { CanchaMantenimiento, CanchaReserva } from '@prisma/client';
import { normalizarHorarioHHmm } from '../../../common/utils/date-time.util';
import { REGLAS_CANCHAS } from '../constants/canchas.constants';

@Injectable()
export class CanchasDisponibilidadService {
  constructor(
    private readonly canchasRepository: CanchasRepository,
    private readonly reservasRepository: ReservasCanchasRepository,
    private readonly sedeService: SedeService,
  ) {}

  async obtenerDisponibilidad(
    id_cancha: number,
    fechaStr: string,
  ): Promise<DisponibilidadSlotResponseDto[]> {
    // 1. Validar existencia de la cancha y obtener a qué sede pertenece
    const cancha = await this.canchasRepository.obtenerPorId(id_cancha);
    if (!cancha || !cancha.activo) {
      throw new NotFoundException(
        `La cancha con ID ${id_cancha} no existe o está inactiva.`,
      );
    }

    // 2. Consultar el horario operativo de la sede cruzando SedeHorario y Calendario
    const horarioSede = await this.sedeService.getHorarioOperativo(
      cancha.id_sede,
      fechaStr,
    );

    // Si la sede está cerrada por feriado, domingo u horario especial, retornamos 0 slots
    if (!horarioSede.abierto) {
      return [];
    }

    // 3. Configurar límites dinámicos del día según la apertura y cierre de la sede
    const [horaApertura, minutoApertura] = normalizarHorarioHHmm(
      horarioSede.hora_apertura,
    )
      .split(':')
      .map(Number);
    const [horaCierre, minutoCierre] = normalizarHorarioHHmm(
      horarioSede.hora_cierre,
    )
      .split(':')
      .map(Number);

    const [year, month, day] = fechaStr.split('-').map(Number);
    const inicioDia = new Date(
      Date.UTC(year, month - 1, day, horaApertura, minutoApertura, 0),
    );
    const finDia = new Date(
      Date.UTC(year, month - 1, day, horaCierre, minutoCierre, 0),
    );

    // Los turnos empiezan en punto y deben caber completos en la apertura.
    if (inicioDia.getUTCMinutes() !== 0) {
      inicioDia.setUTCHours(inicioDia.getUTCHours() + 1, 0, 0, 0);
    }

    // 4. Obtener bloqueos (Reservas y Mantenimientos) en paralelo para esa ventana
    const [reservas, mantenimientos] = await Promise.all([
      this.reservasRepository.obtenerReservasPorFecha(
        id_cancha,
        inicioDia,
        finDia,
      ),
      this.reservasRepository.obtenerMantenimientosPorFecha(
        id_cancha,
        inicioDia,
        finDia,
      ),
    ]);

    // 5. Generar Slots en memoria entre hora_apertura y hora_cierre
    return this.calcularSlotsEnMemoria(
      inicioDia,
      finDia,
      reservas,
      mantenimientos,
    );
  }

  async obtenerDisponibilidadPorSede(
    sedeId: number,
    fechaStr: string,
    tipoId?: number,
  ) {
    // 1. Obtener canchas y horario operativo en paralelo (solo 2 viajes a Supabase)
    const [canchas, horarioSede] = await Promise.all([
      this.canchasRepository.obtenerCanchasParaGrilla(sedeId, tipoId),
      this.sedeService.getHorarioOperativo(sedeId, fechaStr),
    ]);

    const respuestaBase = {
      horario: {
        abierto: horarioSede.abierto,
        hora_apertura: horarioSede.hora_apertura,
        hora_cierre: horarioSede.hora_cierre,
        motivo_cierre: !horarioSede.abierto
          ? 'motivo_cierre' in horarioSede
            ? horarioSede.motivo_cierre
            : 'Sede cerrada'
          : undefined,
      },
      canchas: [] as Array<{
        id_cancha: number;
        nombre_cancha: string;
        costo_base: number;
        slots: DisponibilidadSlotResponseDto[];
      }>,
    };

    if (!canchas.length || !horarioSede.abierto) {
      if (!horarioSede.abierto && canchas.length) {
        respuestaBase.canchas = canchas.map((cancha) => ({
          id_cancha: cancha.id_cancha,
          nombre_cancha: cancha.nombre,
          costo_base: Number(cancha.costo_base),
          slots: [],
        }));
      }
      return respuestaBase;
    }

    // 2. Calcular límites horarios del día
    const [horaApertura, minutoApertura] = normalizarHorarioHHmm(
      horarioSede.hora_apertura,
    )
      .split(':')
      .map(Number);
    const [horaCierre, minutoCierre] = normalizarHorarioHHmm(
      horarioSede.hora_cierre,
    )
      .split(':')
      .map(Number);
    const [year, month, day] = fechaStr.split('-').map(Number);

    const inicioDia = new Date(
      Date.UTC(year, month - 1, day, horaApertura, minutoApertura, 0),
    );
    const finDia = new Date(
      Date.UTC(year, month - 1, day, horaCierre, minutoCierre, 0),
    );

    if (inicioDia.getUTCMinutes() !== 0) {
      inicioDia.setUTCHours(inicioDia.getUTCHours() + 1, 0, 0, 0);
    }

    const idsCanchas = canchas.map((c) => c.id_cancha);

    // 3. Obtener TODAS las reservas y mantenimientos de la sede en paralelo
    const [todasLasReservas, todosLosMantenimientos] = await Promise.all([
      this.reservasRepository.obtenerReservasPorCanchasYFecha(
        idsCanchas,
        inicioDia,
        finDia,
      ),
      this.reservasRepository.obtenerMantenimientosPorCanchasYFecha(
        idsCanchas,
        inicioDia,
        finDia,
      ),
    ]);

    // 4. Agrupar bloqueos por cancha en memoria usando Maps para acceso instantáneo O(1)
    const reservasPorCancha = new Map<number, CanchaReserva[]>();
    for (const r of todasLasReservas) {
      const list = reservasPorCancha.get(r.id_cancha) ?? [];
      list.push(r);
      reservasPorCancha.set(r.id_cancha, list);
    }

    const mantenimientosPorCancha = new Map<number, CanchaMantenimiento[]>();
    for (const m of todosLosMantenimientos) {
      const list = mantenimientosPorCancha.get(m.id_cancha) ?? [];
      list.push(m);
      mantenimientosPorCancha.set(m.id_cancha, list);
    }

    // 5. Construir los resultados en memoria
    respuestaBase.canchas = canchas.map((cancha) => {
      const reservas = reservasPorCancha.get(cancha.id_cancha) ?? [];
      const mantenimientos =
        mantenimientosPorCancha.get(cancha.id_cancha) ?? [];
      const slots = this.calcularSlotsEnMemoria(
        inicioDia,
        finDia,
        reservas,
        mantenimientos,
      );
      return {
        id_cancha: cancha.id_cancha,
        nombre_cancha: cancha.nombre,
        costo_base: Number(cancha.costo_base),
        slots,
      };
    });
    return respuestaBase;
  }

  /**
   * Función pura en memoria: genera slots secuenciales y evalúa colisiones temporales.
   */
  calcularSlotsEnMemoria(
    inicioDia: Date,
    finDia: Date,
    reservas: CanchaReserva[],
    mantenimientos: CanchaMantenimiento[],
  ): DisponibilidadSlotResponseDto[] {
    const slots: DisponibilidadSlotResponseDto[] = [];
    let horaActual = new Date(inicioDia);
    const duracionMs = REGLAS_CANCHAS.DURACION_TURNO_MINUTOS * 60 * 1000;

    while (horaActual.getTime() + duracionMs <= finDia.getTime()) {
      const horaSiguiente = new Date(horaActual);
      horaSiguiente.setUTCHours(horaActual.getUTCHours() + 1);

      // Evaluar colisiones con mantenimientos y reservas
      const enMantenimiento = mantenimientos.some(
        (m) => m.fecha_inicio < horaSiguiente && m.fecha_fin > horaActual,
      );

      const reservado = reservas.some(
        (r) => r.fecha_inicio < horaSiguiente && r.fecha_fin > horaActual,
      );

      let estado = SlotEstado.DISPONIBLE;
      if (enMantenimiento) estado = SlotEstado.MANTENIMIENTO;
      else if (reservado) estado = SlotEstado.RESERVADO;

      slots.push({
        horaInicio: horaActual.toISOString().slice(11, 16),
        horaFin: horaSiguiente.toISOString().slice(11, 16),
        estado,
      });

      horaActual = horaSiguiente;
    }

    return slots;
  }
}
