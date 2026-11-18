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
import { DisponibilidadSlotResponseDto } from '../dto/disponibilidad-slot-response.dto';
import {
  CotizarTurnoQueryDto,
  CotizacionResponseDto,
  MotivoSinDescuento,
} from '../dto/cotizacion-turno.dto';
import { SedeService } from '../../M0-sedes/services/sede.service';
import { PrecioContextService } from './precio-context.service';
import { CotizacionCacheService } from './cotizacion-cache.service';
import { CanchasDisponibilidadService } from './canchas-disponibilidad.service';
import { REGLAS_CANCHAS } from '../constants/canchas.constants';
import { normalizarHorarioHHmm } from '../../../common/utils/date-time.util';

@Injectable()
export class CanchasService {
  constructor(
    private readonly canchasRepository: CanchasRepository,
    private readonly reservasRepository: ReservasCanchasRepository,
    private readonly sedeService: SedeService,
    private readonly precioContext?: PrecioContextService,
    private readonly cotizacionCache: CotizacionCacheService = new CotizacionCacheService(),
    private readonly disponibilidadService: CanchasDisponibilidadService = new CanchasDisponibilidadService(
      canchasRepository,
      reservasRepository,
      sedeService,
    ),
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
    return this.disponibilidadService.obtenerDisponibilidad(
      id_cancha,
      fechaStr,
    );
  }

  async obtenerDisponibilidadPorSede(
    sedeId: number,
    fechaStr: string,
    tipoId?: number,
  ) {
    return this.disponibilidadService.obtenerDisponibilidadPorSede(
      sedeId,
      fechaStr,
      tipoId,
    );
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

    const cacheKey = `${query.canchaId}_${idUsuario}_${query.fecha}`;

    let costoBase: number;
    let esSocio: boolean;
    let aplicaDescuentoSocio: boolean;
    let motivoSinDescuento: MotivoSinDescuento;

    // 2. Verificar caché
    const cached = await this.cotizacionCache.get(cacheKey);
    if (cached) {
      costoBase = cached.costoBase;
      esSocio = cached.esSocio;
      aplicaDescuentoSocio = cached.aplicaDescuentoSocio;
      motivoSinDescuento = cached.motivoSinDescuento;
    } else {
      // 3. Obtener cancha y usuario en paralelo con Prisma (2 consultas concurrentes)
      const [cancha, usuario] = await Promise.all([
        this.canchasRepository.obtenerPorId(query.canchaId),
        this.canchasRepository.obtenerDatosUsuarioParaCotizacion(
          idUsuario,
          query.fecha,
        ),
      ]);

      // Validar cancha (si no existe o está inactiva -> 404)
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

      costoBase = Number(cancha.costo_base);

      // 4. Evaluar condiciones para descuento de socio (15%)
      // a) El usuario tiene rol 'socio' (si es 'externo' u otro rol, no aplica)
      esSocio =
        usuario.usuario_rol?.some(
          (ur) => ur.rol?.nombre?.trim().toLowerCase() === 'socio',
        ) ?? false;

      aplicaDescuentoSocio = false;
      motivoSinDescuento = null;

      if (!esSocio) {
        motivoSinDescuento = 'ROL_EXTERNO';
      } else {
        // b) Membresía ACTIVA (o SUSPENDIDA con pago aprobado) vigente para la fecha del turno: fecha_inicio <= fecha <= fecha_fin
        const tieneMembresiaActiva = (usuario.membresia ?? []).some((m) => {
          const desc = m.membresia_estado?.descripcion?.trim().toLowerCase();
          const esEstadoActivo =
            m.id_membresia_estado === 1 || desc === 'activa';
          const esSuspendidaConPago =
            desc === 'suspendida' && (m.pagos?.length ?? 0) > 0;

          if (!esEstadoActivo && !esSuspendidaConPago) {
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

      // Almacenar en caché el contexto verificado
      await this.cotizacionCache.set(cacheKey, {
        costoBase,
        esSocio,
        aplicaDescuentoSocio,
        motivoSinDescuento,
      });
    }

    // 5. Delegar cálculo de precios dinámicos a PrecioContextService (Strategy Pattern)
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
    const horaNormalizada = normalizarHorarioHHmm(query.hora);
    const [horaStr] = horaNormalizada.split(':');
    const horaNum = parseInt(horaStr, 10);
    const esHorarioPico =
      horaNum >= REGLAS_CANCHAS.HORARIO_PICO_INICIO &&
      horaNum <= REGLAS_CANCHAS.HORARIO_PICO_FIN;
    const montoRecargoPico = esHorarioPico
      ? Math.round(costoBase * (REGLAS_CANCHAS.PORCENTAJE_RECARGO_PICO / 100))
      : 0;
    const descuentoPorcentaje = aplicaDescuentoSocio
      ? REGLAS_CANCHAS.PORCENTAJE_DESCUENTO_SOCIO
      : 0;
    const montoDescuento = aplicaDescuentoSocio
      ? Math.round(
          costoBase * (REGLAS_CANCHAS.PORCENTAJE_DESCUENTO_SOCIO / 100),
        )
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
