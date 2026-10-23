import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CanchasRepository } from '../repositories/canchas.repository';
import { CrearCanchaDto } from '../dto/crear-cancha.dto';
import { ActualizarCanchaDto } from '../dto/actualizar-cancha.dto';
import { ActualizarTipoCanchaDto } from '../dto/actualizar-tipo-cancha.dto';
import { ReservasCanchasRepository } from '../repositories/reservas-canchas.repository';
import {
  DisponibilidadSlotResponseDto,
  SlotEstado,
} from '../dto/disponibilidad-slot-response.dto';
import { SedeService } from '../../M0-sedes/services/sede.service';
import { CanchaMantenimiento, CanchaReserva } from '@prisma/client';

@Injectable()
export class CanchasService {
  constructor(
    private readonly canchasRepository: CanchasRepository,
    private readonly reservasRepository: ReservasCanchasRepository,
    private readonly sedeService: SedeService,
  ) {}

  async crearCancha(dto: CrearCanchaDto) {
    // Validación 1: Verificar que la sede exista
    const sedeValida = await this.canchasRepository.existeSede(dto.id_sede);
    if (!sedeValida) {
      throw new BadRequestException(`La sede con ID ${dto.id_sede} no existe.`);
    }

    // Validación 2: Verificar que el tipo de cancha exista
    const tipoValido = await this.canchasRepository.existeTipoCancha(
      dto.id_cancha_tipo,
    );
    if (!tipoValido) {
      throw new BadRequestException(
        `El tipo de cancha con ID ${dto.id_cancha_tipo} no existe.`,
      );
    }

    return this.canchasRepository.crear(dto);
  }

  async listarCanchas(sedeId?: number) {
    return await this.canchasRepository.obtenerTodasActivas(sedeId);
  }

  async listarTiposCancha(inactivos?: boolean) {
    return await this.canchasRepository.obtenerTiposCancha(inactivos);
  }

  async crearTipoCancha(descripcion: string) {
    const descripcionLimpia = descripcion?.trim();
    if (!descripcionLimpia) {
      throw new BadRequestException(
        'La descripción del tipo de cancha es obligatoria.',
      );
    }
    return await this.canchasRepository.crearTipoCancha(descripcionLimpia);
  }

  async actualizarTipoCancha(id: number, dto: ActualizarTipoCanchaDto) {
    const tipoValido = await this.canchasRepository.existeTipoCancha(id);
    if (!tipoValido) {
      throw new NotFoundException(`El tipo de cancha con ID ${id} no existe.`);
    }

    if (dto.descripcion !== undefined) {
      const descripcionLimpia = dto.descripcion.trim();
      if (!descripcionLimpia) {
        throw new BadRequestException(
          'La descripción del tipo de cancha no puede estar vacía.',
        );
      }
      dto.descripcion = descripcionLimpia;
    }

    if (dto.descripcion === undefined && dto.activo === undefined) {
      throw new BadRequestException(
        'Debe enviar al menos un campo para actualizar (descripción o activo).',
      );
    }

    return await this.canchasRepository.actualizarTipoCancha(id, dto);
  }

  async eliminarTipoCancha(id: number) {
    const tipoValido = await this.canchasRepository.existeTipoCancha(id);
    if (!tipoValido) {
      throw new NotFoundException(`El tipo de cancha con ID ${id} no existe.`);
    }

    const canchasActivas =
      await this.canchasRepository.contarCanchasActivasPorTipo(id);
    if (canchasActivas > 0) {
      throw new BadRequestException(
        `No es posible dar de baja el tipo de cancha porque tiene ${canchasActivas} cancha(s) activa(s) asociada(s).`,
      );
    }

    return await this.canchasRepository.borradoLogicoTipoCancha(id);
  }

  async obtenerCancha(id: number) {
    const cancha = await this.canchasRepository.obtenerPorId(id);
    if (!cancha || !cancha.activo) {
      throw new NotFoundException(
        `La cancha con ID ${id} no existe o está inactiva.`,
      );
    }
    return cancha;
  }

  async actualizarCancha(id: number, dto: ActualizarCanchaDto) {
    // Validar existencia previa
    await this.obtenerCancha(id);
    return this.canchasRepository.actualizar(id, dto);
  }

  async eliminarCancha(id: number) {
    // Validar existencia previa
    await this.obtenerCancha(id);
    return this.canchasRepository.borradoLogico(id);
  }

  async obtenerDisponibilidad(
    id_cancha: number,
    fechaStr: string,
  ): Promise<DisponibilidadSlotResponseDto[]> {
    // 1. Validar existencia de la cancha y obtener a qué sede pertenece
    const cancha = await this.obtenerCancha(id_cancha);

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
    const [horaApertura, minutoApertura] = horarioSede.hora_apertura
      .split(':')
      .map(Number);
    const [horaCierre, minutoCierre] = horarioSede.hora_cierre
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
    const slots: DisponibilidadSlotResponseDto[] = [];
    let horaActual = new Date(inicioDia);

    while (horaActual.getTime() + 60 * 60 * 1000 <= finDia.getTime()) {
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

  async obtenerDisponibilidadPorSede(sedeId: number, fechaStr: string) {
  // 1. Obtener canchas y horario operativo en paralelo (solo 2 viajes a Supabase)
  const [canchas, horarioSede] = await Promise.all([
    this.canchasRepository.obtenerTodasActivas(sedeId),
    this.sedeService.getHorarioOperativo(sedeId, fechaStr),
  ]);

  if (!canchas.length) {
    return [];
  }

  // Si la sede está cerrada ese día, retornamos las canchas con slots vacíos sin consultar reservas
  if (!horarioSede.abierto) {
    return canchas.map((cancha) => ({
      id_cancha: cancha.id_cancha,
      nombre_cancha: cancha.nombre,
      costo_base: Number(cancha.costo_base),
      slots: [],
    }));
  }

  // 2. Calcular límites horarios del día
  const [horaApertura, minutoApertura] = horarioSede.hora_apertura.split(':').map(Number);
  const [horaCierre, minutoCierre] = horarioSede.hora_cierre.split(':').map(Number);
  const [year, month, day] = fechaStr.split('-').map(Number);

  const inicioDia = new Date(Date.UTC(year, month - 1, day, horaApertura, minutoApertura, 0));
  const finDia = new Date(Date.UTC(year, month - 1, day, horaCierre, minutoCierre, 0));

  if (inicioDia.getUTCMinutes() !== 0) {
    inicioDia.setUTCHours(inicioDia.getUTCHours() + 1, 0, 0, 0);
  }

  const idsCanchas = canchas.map((c) => c.id_cancha);

  // 3. Obtener TODAS las reservas y mantenimientos de la sede en paralelo (1 solo viaje)
  const [todasLasReservas, todosLosMantenimientos] = await Promise.all([
    this.reservasRepository.obtenerReservasPorCanchasYFecha(idsCanchas, inicioDia, finDia),
    this.reservasRepository.obtenerMantenimientosPorCanchasYFecha(idsCanchas, inicioDia, finDia),
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

  // 5. Construir los resultados en memoria (cero llamadas de red)
  return canchas.map((cancha) => {
    const reservasCancha = reservasPorCancha.get(cancha.id_cancha) ?? [];
    const mantenimientosCancha = mantenimientosPorCancha.get(cancha.id_cancha) ?? [];

    const slots = this.calcularSlotsEnMemoria(
      inicioDia,
      finDia,
      reservasCancha,
      mantenimientosCancha,
    );

    return {
      id_cancha: cancha.id_cancha,
      nombre_cancha: cancha.nombre,
      costo_base: Number(cancha.costo_base),
      slots,
    };
  });
}

/**
 * Función pura en memoria: no toca la base de datos
 */
private calcularSlotsEnMemoria(
  inicioDia: Date,
  finDia: Date,
  reservas: CanchaReserva[],
  mantenimientos: CanchaMantenimiento[],
): DisponibilidadSlotResponseDto[] {
  const slots: DisponibilidadSlotResponseDto[] = [];
  let horaActual = new Date(inicioDia);

  while (horaActual.getTime() + 60 * 60 * 1000 <= finDia.getTime()) {
    const horaSiguiente = new Date(horaActual);
    horaSiguiente.setUTCHours(horaActual.getUTCHours() + 1);

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
/*
  async obtenerDisponibilidadPorSede(sedeId: number, fechaStr: string) {
    // 1. Obtiene las canchas de la sede mediante el repositorio existente
    const canchas = await this.canchasRepository.obtenerTodasActivas(sedeId);

    // 2. Ejecuta la disponibilidad en paralelo reutilizando la función que ya tienen
    const resultados = await Promise.all(
      canchas.map(async (cancha) => {
        const slots = await this.obtenerDisponibilidad(
          cancha.id_cancha,
          fechaStr,
        );
        return {
          id_cancha: cancha.id_cancha,
          nombre_cancha: cancha.nombre,
          costo_base: Number(cancha.costo_base),
          slots,
        };
      }),
    );

    return resultados;
  }
    */
}
