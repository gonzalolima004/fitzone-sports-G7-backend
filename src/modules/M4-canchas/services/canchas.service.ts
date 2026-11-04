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
import {
  CotizarTurnoQueryDto,
  CotizacionResponseDto,
  MotivoSinDescuento,
} from '../dto/cotizacion-turno.dto';
import { SedeService } from '../../M0-sedes/services/sede.service';
import { CanchaMantenimiento, CanchaReserva } from '@prisma/client';
import { PrecioContextService } from './precio-context.service';

@Injectable()
export class CanchasService {
  constructor(
    private readonly canchasRepository: CanchasRepository,
    private readonly reservasRepository: ReservasCanchasRepository,
    private readonly sedeService: SedeService,
    private readonly precioContext?: PrecioContextService,
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

  /**
   * Conecta el cálculo de precios dinámicos con el endpoint /canchas/cotizar,
   * validando que el descuento de socio aplique solo si tiene membresía activa
   * y reserva en una sede de su misma ciudad.
   */
  async cotizarTurno(
    query: CotizarTurnoQueryDto,
    idUsuario: number,
  ): Promise<CotizacionResponseDto> {
    // 1. Validar fecha válida en calendario
    const [year, month, day] = query.fecha.split('-').map(Number);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));
    if (
      isNaN(parsedDate.getTime()) ||
      parsedDate.getUTCFullYear() !== year ||
      parsedDate.getUTCMonth() !== month - 1 ||
      parsedDate.getUTCDate() !== day
    ) {
      throw new BadRequestException('Formato de fecha inválido.');
    }

    // 2. Obtener cancha y usuario en paralelo
    const [cancha, usuario] = await Promise.all([
      this.canchasRepository.obtenerPorId(query.canchaId),
      this.canchasRepository.obtenerDatosUsuarioParaCotizacion(idUsuario),
    ]);

    // Validar cancha (RN: si no existe o está inactiva -> 404)
    if (!cancha || !cancha.activo) {
      throw new NotFoundException(
        `La cancha con ID ${query.canchaId} no existe o se encuentra inactiva.`,
      );
    }

    // Validar usuario
    if (!usuario) {
      throw new NotFoundException(
        `El usuario con ID ${idUsuario} no fue encontrado.`,
      );
    }

    const costoBase = Number(cancha.costo_base);

    // 3. Evaluar condiciones para descuento de socio (15%)
    // a) El usuario tiene rol 'socio' (si es 'externo' u otro rol, no aplica)
    const esSocio =
      usuario.usuario_rol?.some(
        (ur) => ur.rol?.nombre?.trim().toLowerCase() === 'socio',
      ) ?? false;

    let aplicaDescuentoSocio = false;
    let motivoSinDescuento: MotivoSinDescuento = null;

    if (!esSocio) {
      motivoSinDescuento = 'ROL_EXTERNO';
    } else {
      // b) Membresía ACTIVA vigente para la fecha del turno: fecha_inicio <= fecha <= fecha_fin
      const tieneMembresiaActiva = (usuario.membresia ?? []).some((m) => {
        const esEstadoActivo =
          m.id_membresia_estado === 1 ||
          m.membresia_estado?.descripcion?.trim().toLowerCase() === 'activa';

        if (!esEstadoActivo) {
          return false;
        }

        const fechaInicioStr = m.fecha_inicio.toISOString().slice(0, 10);
        const fechaFinStr = m.fecha_fin.toISOString().slice(0, 10);

        return fechaInicioStr <= query.fecha && query.fecha <= fechaFinStr;
      });

      if (!tieneMembresiaActiva) {
        motivoSinDescuento = 'SIN_MEMBRESIA';
      } else {
        // c) Misma Ciudad: usuario.id_sede -> sede.id_ciudad coincide con cancha.id_sede -> sede.id_ciudad
        const usuarioCiudadId = usuario.sede?.id_ciudad;
        const canchaCiudadId = cancha.sede?.id_ciudad;

        if (
          !usuarioCiudadId ||
          !canchaCiudadId ||
          usuarioCiudadId !== canchaCiudadId
        ) {
          motivoSinDescuento = 'OTRA_CIUDAD';
        } else {
          aplicaDescuentoSocio = true;
          motivoSinDescuento = null;
        }
      }
    }

    // 4. Delegar cálculo de precios dinámicos a PrecioContextService
    if (this.precioContext) {
      return this.precioContext.calcularCotizacion({
        costoBase,
        hora: query.hora,
        esSocio,
        aplicaDescuentoSocio,
        motivoSinDescuento,
      });
    }

    // Fallback defensivo si se instancia sin DI
    const [horaStr] = query.hora.split(':');
    const horaNum = parseInt(horaStr, 10);
    const esHorarioPico = horaNum >= 19 && horaNum < 21;
    const montoRecargoPico = esHorarioPico ? Math.round(costoBase * 0.2) : 0;
    const descuentoPorcentaje = aplicaDescuentoSocio ? 15 : 0;
    const montoDescuento = aplicaDescuentoSocio
      ? Math.round(costoBase * 0.15)
      : 0;
    const precioFinal = costoBase - montoDescuento + montoRecargoPico;

    return {
      costo_base: costoBase,
      descuento_porcentaje: descuentoPorcentaje,
      monto_descuento: montoDescuento,
      es_horario_pico: esHorarioPico,
      monto_recargo_pico: montoRecargoPico,
      precio_final: precioFinal,
      es_socio: esSocio,
      aplica_descuento_socio: aplicaDescuentoSocio,
      motivo_sin_descuento: motivoSinDescuento,
    };
  }
}
