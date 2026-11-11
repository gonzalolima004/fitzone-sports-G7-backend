import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { MercadoPagoService } from './mercadopago.service';
import { GeneradorPdfService } from './generador-pdf.service';
import {
  PagosRepository,
  PagoConRelaciones,
  PagoConDetalleCompleto,
} from '../repositories/pagos.repository';
import { IniciarPagoDto } from '../dto/iniciar-pago.dto';
import { PreferenciaPagoResponseDto } from '../dto/preferencia-pago-response.dto';
import {
  ComprobanteItemDto,
  ComprobanteResponseDto,
} from '../dto/comprobante-response.dto';
import {
  PagoDetalleResponseDto,
  PagoConceptoDto,
} from '../dto/pago-detalle-response.dto';
import { PagoPendienteResponseDto } from '../dto/pago-pendiente-response.dto';
import { etiquetaPlan } from '../../M1-usuarios/utils/plan-duracion';
import {
  MEMBRESIA_ESTADO,
  PAGO_ESTADO,
  esEstado,
} from '../constants/estados.constants';
import { EstadosService } from './estados.service';

@Injectable()
export class PagosService {
  private readonly logger = new Logger(PagosService.name);
  private readonly syncUsuariosEnCurso = new Map<number, Promise<void>>();

  constructor(
    private readonly mercadopagoService: MercadoPagoService,
    private readonly pagosRepository: PagosRepository,
    private readonly generadorPdfService: GeneradorPdfService,
    private readonly estadosService: EstadosService,
  ) {}

  /**
   * Crea una preferencia de pago en Mercado Pago (Checkout Pro) y persiste
   * la intención de pago en la base de datos con estado Pendiente.
   */
  async crearPreferenciaPago(
    dto: IniciarPagoDto,
    userId?: number,
  ): Promise<PreferenciaPagoResponseDto> {
    // 1. Validar concepto único: exactamente una entidad asociada
    const tieneCancha =
      dto.id_cancha_reserva !== undefined && dto.id_cancha_reserva !== null;
    const tienePlan =
      dto.id_membresia_plan !== undefined && dto.id_membresia_plan !== null;
    const tieneMembresia =
      dto.id_membresia !== undefined && dto.id_membresia !== null;
    const tieneConceptoMembresia = tienePlan || tieneMembresia;

    if (
      (tieneCancha && tieneConceptoMembresia) ||
      (!tieneCancha && !tieneConceptoMembresia)
    ) {
      throw new BadRequestException(
        'Debe asociar el pago exactamente a una reserva de cancha o a un plan/membresía.',
      );
    }

    let idMembresiaParaPago: number | null = null;
    let montoTotal = dto.monto ? Math.round(Number(dto.monto)) : 0;
    let tituloItem = dto.titulo;

    // 2. Verificar existencia y resolver entidad asociada
    if (tieneCancha) {
      const reserva = await this.pagosRepository.obtenerCanchaReservaPorId(
        dto.id_cancha_reserva!,
      );
      if (!reserva) {
        throw new NotFoundException(
          `La reserva de cancha #${dto.id_cancha_reserva} no existe.`,
        );
      }
      this.asegurarPropiedad(reserva.id_usuario, userId);
      if (!montoTotal) {
        throw new BadRequestException(
          'El monto es requerido para reservas de cancha.',
        );
      }
    } else if (tienePlan) {
      const plan = await this.pagosRepository.obtenerPlanPorId(
        dto.id_membresia_plan!,
      );
      if (!plan) {
        throw new NotFoundException(
          `El plan de membresía #${dto.id_membresia_plan} no existe.`,
        );
      }
      // Se utiliza el precio oficial registrado en la base de datos
      montoTotal = Math.round(Number(plan.precio));
      if (!tituloItem) {
        tituloItem = `Suscripción - ${plan.nombre}`;
      }

      // Obtener el ID del socio
      let targetUserId = userId;
      if (!targetUserId && dto.email_pagador) {
        const u = await this.pagosRepository.obtenerUsuarioPorEmail(
          dto.email_pagador,
        );
        targetUserId = u?.id_usuario;
      }

      if (!targetUserId) {
        throw new BadRequestException(
          'No se pudo determinar el usuario socio para asociar la membresía.',
        );
      }

      // Reutilizar intención de membresía 'Suspendida' sin pago aprobado si ya existía,
      // evitando acumular registros huérfanos cuando el usuario abre el checkout y no paga
      const intencionExistente =
        await this.pagosRepository.obtenerMembresiaSuspendidaSinPagoAprobado(
          targetUserId,
        );

      if (intencionExistente) {
        const membresiaActualizada =
          await this.pagosRepository.actualizarIntencionMembresia(
            intencionExistente.id_membresia,
            {
              id_membresia_plan: plan.id_membresia_plan,
            },
          );
        idMembresiaParaPago = membresiaActualizada.id_membresia;
      } else {
        const idSuspendida =
          await this.estadosService.getMembresiaSuspendidaId();
        const nuevaMembresia = await this.pagosRepository.crearMembresia({
          id_usuario: targetUserId,
          id_membresia_plan: plan.id_membresia_plan,
          id_membresia_estado: idSuspendida,
          fecha_inicio: new Date(),
          fecha_fin: new Date(),
        });
        idMembresiaParaPago = nuevaMembresia.id_membresia;
      }
    } else if (tieneMembresia) {
      const m = await this.pagosRepository.obtenerMembresiaPorId(
        dto.id_membresia!,
      );
      if (!m) {
        throw new NotFoundException(
          `La membresía #${dto.id_membresia} no existe.`,
        );
      }
      this.asegurarPropiedad(m.id_usuario, userId);
      idMembresiaParaPago = dto.id_membresia!;
      if (!montoTotal) {
        montoTotal = Math.round(Number(m.membresia_plan?.precio ?? 0));
      }
    }

    // 3. Obtener el ID del estado 'Pendiente' en pago_estado
    const idPagoEstado = await this.estadosService.getPagoPendienteId();

    // 4. Invocar el SDK oficial de Mercado Pago para crear la preferencia
    const itemId = tieneCancha
      ? `cancha-${dto.id_cancha_reserva}`
      : `membresia-${idMembresiaParaPago}`;

    let payerEmail = dto.email_pagador || 'cliente@fitzone.com';
    if (userId) {
      const u = await this.pagosRepository.obtenerUsuarioPorId(userId);
      if (u?.email) payerEmail = u.email;
    }

    const backUrls = this.mercadopagoService.backUrls;
    const notificationUrl = this.mercadopagoService.notificationUrl;

    const preference = await this.mercadopagoService.preference
      .create({
        body: {
          items: [
            {
              id: itemId,
              title: tituloItem,
              quantity: 1,
              unit_price: montoTotal,
              currency_id: 'ARS',
            },
          ],
          payer: {
            email: payerEmail,
          },
          back_urls: backUrls?.success
            ? {
                success: backUrls.success,
                failure: backUrls.failure,
                pending: backUrls.pending,
              }
            : undefined,
          auto_return:
            backUrls?.success && !backUrls.success.includes('localhost')
              ? 'approved'
              : undefined,
          notification_url:
            notificationUrl && !notificationUrl.includes('localhost')
              ? notificationUrl
              : undefined,
          external_reference: itemId,
          metadata: {
            id_cancha_reserva: dto.id_cancha_reserva ?? null,
            id_membresia: idMembresiaParaPago,
          },
        },
      })
      .catch((error: unknown) => {
        this.logger.error(
          'Error al crear la preferencia en Mercado Pago:',
          error,
        );
        throw new InternalServerErrorException(
          'No se pudo generar la preferencia de pago en Mercado Pago.',
        );
      });

    if (!preference.id) {
      throw new InternalServerErrorException(
        'Mercado Pago no retornó un identificador de preferencia válido.',
      );
    }

    // 5. Persistir o reutilizar la intención en la tabla `pago` con estado 'Pendiente'
    // RNF-02: Se almacena solo el ID en token_transaccion, sin datos sensibles de tarjeta.
    const pagoPendienteExistente = tieneCancha
      ? await this.pagosRepository.obtenerUltimoPagoPendienteCancha(
          dto.id_cancha_reserva!,
        )
      : idMembresiaParaPago
        ? await this.pagosRepository.obtenerUltimoPagoPendienteMembresia(
            idMembresiaParaPago,
          )
        : null;

    const nuevoPago = pagoPendienteExistente
      ? await this.pagosRepository.actualizarPagoPendiente(
          pagoPendienteExistente.id_pago,
          {
            monto: montoTotal,
            token_transaccion: preference.id,
          },
        )
      : await this.pagosRepository.crearPago({
          id_pago_estado: idPagoEstado,
          id_cancha_reserva: dto.id_cancha_reserva ?? null,
          id_membresia: idMembresiaParaPago,
          monto: montoTotal,
          token_transaccion: preference.id,
          comprobante_url: null,
        });

    this.logger.log(
      `Intención de pago #${nuevoPago.id_pago} registrada exitosamente (Preferencia: ${preference.id}).`,
    );

    // 6. Retornar DTO de respuesta con las URLs oficiales de checkout
    return {
      preferenceId: preference.id,
      initPoint: preference.init_point || '',
      sandboxInitPoint: preference.sandbox_init_point || '',
      id_pago: nuevoPago.id_pago,
    };
  }

  /**
   * Lanza 403 si el recurso no pertenece al usuario autenticado.
   * Si no hay usuario (flujo sin sesión) no se aplica la validación.
   */
  private asegurarPropiedad(
    id_usuario_recurso: number | null | undefined,
    id_usuario?: number,
  ): void {
    if (id_usuario !== undefined && id_usuario_recurso !== id_usuario) {
      throw new ForbiddenException(
        'No tienes permisos para operar sobre este recurso.',
      );
    }
  }

  /**
   * Procesa la notificación de un webhook de pago emitido por Mercado Pago
   * 1. Consulta y certifica el estado real en los servidores de Mercado Pago (Payment.get).
   * 2. Localiza el registro del pago en la base de datos.
   * 3. Garantiza idempotencia: si el pago ya está 'Aprobado', omite la transacción sin error.
   * 4. Si el estado es 'approved', ejecuta la confirmación atómica con $transaction.
   * 5. Si el estado es 'rejected' o 'cancelled', marca el pago como 'Rechazado'.
   */
  async procesarWebhook(paymentId: string | number, fallbackIdPago?: number) {
    this.logger.log(
      `Iniciando procesamiento de webhook para el pago #${paymentId}...`,
    );

    // 1. Obtener el estado verificado directamente desde Mercado Pago
    const payment = await this.mercadopagoService.consultarPago(paymentId);
    if (!payment || !payment.id) {
      this.logger.warn(
        `No se pudo obtener la información del pago #${paymentId} en Mercado Pago.`,
      );
      return {
        received: true,
        status: 'ignored',
        message: `Pago #${paymentId} no encontrado en Mercado Pago`,
      };
    }

    // 2. Buscar el registro local del pago
    let pago: PagoConRelaciones | null = null;

    // A. Búsqueda por external_reference (cancha-X, membresia-Y o ID numérico)
    if (payment.external_reference) {
      const extRef = payment.external_reference;
      if (!isNaN(Number(extRef))) {
        pago = await this.pagosRepository.obtenerPorId(Number(extRef));
      } else if (extRef.startsWith('cancha-')) {
        const idCanchaReserva = Number(extRef.replace('cancha-', ''));
        pago =
          await this.pagosRepository.obtenerUltimoPagoPendienteCancha(
            idCanchaReserva,
          );
      } else if (extRef.startsWith('membresia-')) {
        const idMembresia = Number(extRef.replace('membresia-', ''));
        pago =
          await this.pagosRepository.obtenerUltimoPagoPendienteMembresia(
            idMembresia,
          );
      }
    }

    // B. Búsqueda por metadata
    interface PagoMetadata {
      id_cancha_reserva?: number | string | null;
      id_membresia?: number | string | null;
    }
    const metadata = (payment as { metadata?: PagoMetadata }).metadata;
    if (!pago && metadata) {
      if (metadata.id_cancha_reserva) {
        pago = await this.pagosRepository.obtenerUltimoPagoPendienteCancha(
          Number(metadata.id_cancha_reserva),
        );
      } else if (metadata.id_membresia) {
        pago = await this.pagosRepository.obtenerUltimoPagoPendienteMembresia(
          Number(metadata.id_membresia),
        );
      }
    }

    // C. Búsqueda por token de transacción
    if (!pago) {
      pago = await this.pagosRepository.obtenerPorTokenTransaccion(
        String(payment.id),
      );
    }

    // D. Fallback por ID de pago explícito (cuando se invoca desde verificación de retorno)
    if (!pago && fallbackIdPago) {
      pago = await this.pagosRepository.obtenerPorId(fallbackIdPago);
    }

    if (!pago) {
      this.logger.warn(
        `No se encontró pago local para Mercado Pago #${paymentId} (external_reference: ${payment.external_reference}).`,
      );
      return {
        received: true,
        status: 'unmatched',
        message: `No se encontró pago local para el pago #${paymentId}`,
      };
    }

    // 3. Control de Idempotencia: Si ya está Aprobado, omitir re-procesamiento
    if (esEstado(pago.pago_estado, PAGO_ESTADO.APROBADO)) {
      this.logger.log(
        `Idempotencia garantizada: El pago local #${pago.id_pago} ya figura como 'Aprobado'. Notificación omitida sin errores.`,
      );
      return {
        received: true,
        status: 'already_approved',
        message: `Pago #${pago.id_pago} ya se encontraba aprobado`,
      };
    }

    // 4. Procesar según estado oficial certificado por Mercado Pago
    const mpStatus = payment.status?.toLowerCase();

    if (mpStatus === 'approved') {
      const idEstadoAprobado = await this.estadosService.getPagoAprobadoId();
      const idEstadoReservaConfirmada =
        await this.estadosService.getReservaConfirmadaId();
      const idEstadoMembresiaActiva =
        await this.estadosService.getMembresiaActivaId();
      const idEstadoMembresiaSuspendida =
        await this.estadosService.getMembresiaSuspendidaId();

      const pagoConfirmado =
        await this.pagosRepository.confirmarPagoTransaccional({
          id_pago: pago.id_pago,
          id_pago_estado: idEstadoAprobado,
          comprobante_url: `/pagos/${pago.id_pago}/comprobante`,
          token_transaccion: String(payment.id),
          id_cancha_reserva: pago.id_cancha_reserva,
          id_cancha_reserva_estado: idEstadoReservaConfirmada,
          id_membresia: pago.id_membresia,
          id_membresia_estado: idEstadoMembresiaActiva,
          id_membresia_estado_suspendida: idEstadoMembresiaSuspendida,
        });

      this.logger.log(
        `Pago #${pagoConfirmado.id_pago} confirmado atómicamente ($transaction) con estado 'Aprobado'. Servicio asociado actualizado.`,
      );

      return {
        received: true,
        status: 'approved',
        message: `Pago #${pagoConfirmado.id_pago} aprobado y confirmado exitosamente`,
      };
    }

    if (mpStatus === 'rejected' || mpStatus === 'cancelled') {
      const idEstadoRechazado = await this.estadosService.getPagoRechazadoId();
      await this.pagosRepository.marcarPagoRechazado(
        pago.id_pago,
        idEstadoRechazado,
      );

      this.logger.warn(
        `Pago #${pago.id_pago} actualizado con estado 'Rechazado' en la base de datos (Mercado Pago: ${payment.status}).`,
      );

      return {
        received: true,
        status: 'rejected',
        message: `Pago #${pago.id_pago} marcado como rechazado`,
      };
    }

    // Otros estados intermedios (ej: in_process, pending)
    this.logger.log(
      `Pago #${pago.id_pago} reportado por Mercado Pago con estado intermedio '${payment.status}'. No se requieren acciones transaccionales.`,
    );

    return {
      received: true,
      status: 'pending',
      message: `Pago #${pago.id_pago} en estado '${payment.status}'`,
    };
  }

  /**
   * Obtiene y estructura los datos completos del comprobante de un pago
   * asegurando la persistencia de comprobante_url en la base de datos si no existía.
   */
  async obtenerDatosComprobante(
    id_pago: number,
    id_usuario: number,
  ): Promise<ComprobanteResponseDto> {
    const pago =
      await this.pagosRepository.obtenerPagoCompletoParaComprobante(id_pago);

    if (!pago) {
      throw new NotFoundException(`El pago #${id_pago} no fue encontrado.`);
    }

    const usuarioPago =
      pago.cancha_reserva?.id_usuario ?? pago.membresia?.id_usuario;
    if (usuarioPago !== id_usuario) {
      throw new ForbiddenException(
        'No tienes permisos para consultar este comprobante o pago.',
      );
    }

    // Actualizar comprobante_url en BD si estaba nulo o desactualizado
    const comprobanteUrl = `/pagos/${id_pago}/comprobante`;
    if (pago.comprobante_url !== comprobanteUrl) {
      await this.pagosRepository.actualizarComprobanteUrl(
        id_pago,
        comprobanteUrl,
      );
      pago.comprobante_url = comprobanteUrl;
    }

    // Estructurar emisor institucional
    const emisor = {
      nombre: 'FitZone Sports Club',
      subtitulo: 'Comprobante de Pago Electrónico (RF-14)',
      descripcion: 'Gestión integral de canchas, socios y membresías',
      contacto: 'soporte@fitzone.com',
    };

    // Estructurar cliente / socio
    const usuario = pago.cancha_reserva?.usuario || pago.membresia?.usuario;
    const cliente = {
      nombre: usuario?.nombre || 'Cliente',
      apellido: usuario?.apellido || 'FitZone',
      dni: usuario?.dni || '-',
      email: usuario?.email || 'cliente@fitzone.com',
    };

    // Estructurar conceptos e ítems
    const items: ComprobanteItemDto[] = [];
    if (pago.cancha_reserva) {
      const r = pago.cancha_reserva;
      const nombreCancha = r.cancha?.nombre || 'Cancha Deportiva';
      const nombreSede = r.cancha?.sede?.nombre || 'Sede Central';
      const sedeLimpia = nombreSede.replace(/^Sede\s+/i, '');
      const fechaStr = new Date(r.fecha_inicio).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      const horaInicio = new Date(r.fecha_inicio).toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const horaFin = new Date(r.fecha_fin).toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      items.push({
        concepto: `Reserva ${nombreCancha}`,
        detalle: `${sedeLimpia} • ${fechaStr} de ${horaInicio} a ${horaFin} hs`,
        cantidad: 1,
        precio_unitario: Math.round(Number(pago.monto)),
        subtotal: Math.round(Number(pago.monto)),
      });
    } else if (pago.membresia) {
      const m = pago.membresia;
      const nombrePlan = m.membresia_plan?.nombre || 'Plan FitZone';
      const dias = m.membresia_plan?.duracion_dias || 30;
      const etiqueta = etiquetaPlan(dias);
      const inicioStr = new Date(m.fecha_inicio).toLocaleDateString('es-AR');
      const finStr = new Date(m.fecha_fin).toLocaleDateString('es-AR');

      items.push({
        concepto: `Membresía ${nombrePlan}`,
        detalle: `${etiqueta} • Vigencia: ${inicioStr} al ${finStr} (${dias} días)`,
        cantidad: 1,
        precio_unitario: Math.round(Number(pago.monto)),
        subtotal: Math.round(Number(pago.monto)),
      });
    } else {
      items.push({
        concepto: 'Servicio Deportivo FitZone',
        detalle: 'Abono general registrado',
        cantidad: 1,
        precio_unitario: Math.round(Number(pago.monto)),
        subtotal: Math.round(Number(pago.monto)),
      });
    }

    const nroTicket = `FZ-PAGO-${String(pago.id_pago).padStart(8, '0')}`;
    const montoTotal = Math.round(Number(pago.monto));

    return {
      id_pago: pago.id_pago,
      nro_ticket: nroTicket,
      fecha_emision: pago.fecha_pago,
      emisor,
      cliente,
      items,
      subtotal: montoTotal,
      descuento: 0,
      total: montoTotal,
      moneda: 'ARS',
      metodo_pago: 'Mercado Pago (Checkout Pro)',
      token_transaccion: pago.token_transaccion,
      estado: pago.pago_estado?.descripcion || 'Aprobado',
      nota_seguridad:
        'Transacción validada según norma RNF-02 (PCI-DSS). FitZone Sports no almacena datos sensibles de tarjetas bancarias.',
      leyenda_pie:
        'FitZone Sports Club • Comprobante emitido electrónicamente on-the-fly sin persistencia en disco (RF-14).',
      comprobante_url: comprobanteUrl,
    };
  }

  /**
   * Genera el buffer binario del comprobante PDF en memoria para descarga o visualización inline.
   */
  async generarComprobantePdf(
    id_pago: number,
    id_usuario: number,
  ): Promise<Buffer> {
    const datos = await this.obtenerDatosComprobante(id_pago, id_usuario);
    return this.generadorPdfService.generarComprobante(datos);
  }

  /**
   * Transforma un registro de pago y sus relaciones en el DTO de respuesta detallado.
   */
  private formatearDetallePago(
    pago: PagoConDetalleCompleto,
  ): PagoDetalleResponseDto {
    let concepto: PagoConceptoDto;

    if (pago.cancha_reserva) {
      const r = pago.cancha_reserva;
      const nombreCancha = r.cancha?.nombre || 'Cancha Deportiva';
      const nombreSede = r.cancha?.sede?.nombre || 'Sede Central';
      const sedeLimpia = nombreSede.replace(/^Sede\s+/i, '');
      const fechaStr = new Date(r.fecha_inicio).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      const horaInicio = new Date(r.fecha_inicio).toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const horaFin = new Date(r.fecha_fin).toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      concepto = {
        tipo: 'cancha',
        id_referencia: r.id_cancha_reserva,
        titulo: `Reserva ${nombreCancha}`,
        detalle: `${sedeLimpia} • ${fechaStr} de ${horaInicio} a ${horaFin} hs`,
      };
    } else if (pago.membresia) {
      const m = pago.membresia;
      const nombrePlan = m.membresia_plan?.nombre || 'Plan FitZone';
      const dias = m.membresia_plan?.duracion_dias || 30;
      const etiqueta = etiquetaPlan(dias);
      const inicioStr = new Date(m.fecha_inicio).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      const finStr = new Date(m.fecha_fin).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

      concepto = {
        tipo: 'membresia',
        id_referencia: m.id_membresia,
        titulo: `Membresía ${nombrePlan}`,
        detalle: `${etiqueta} • Vigencia: ${inicioStr} al ${finStr}`,
        duracion_dias: dias,
      };
    } else {
      concepto = {
        tipo: 'general',
        id_referencia: null,
        titulo: 'Servicio Deportivo FitZone',
        detalle: 'Abono general registrado',
      };
    }

    const comprobanteUrl =
      pago.comprobante_url || `/pagos/${pago.id_pago}/comprobante`;

    return {
      id_pago: pago.id_pago,
      monto: Math.round(Number(pago.monto)),
      fecha_pago: pago.fecha_pago,
      estado: pago.pago_estado?.descripcion || 'Pendiente',
      token_transaccion: pago.token_transaccion,
      comprobante_url: comprobanteUrl,
      concepto,
    };
  }

  /**
   * Reconcilia un pago local en estado 'Pendiente' buscando en Mercado Pago por external_reference.
   * Cubre entornos locales o flujos donde el usuario vuelve a la app sin webhook ni query payment_id.
   */
  async sincronizarPagoPendientePorReferencia(pago: {
    id_pago: number;
    id_membresia?: number | null;
    id_cancha_reserva?: number | null;
  }): Promise<boolean> {
    if (!this.mercadopagoService.buscarPagosPorReferenciaExterna) {
      return false;
    }

    const externalReference = pago.id_membresia
      ? `membresia-${pago.id_membresia}`
      : pago.id_cancha_reserva
        ? `cancha-${pago.id_cancha_reserva}`
        : null;

    if (!externalReference) return false;

    try {
      const resultados =
        await this.mercadopagoService.buscarPagosPorReferenciaExterna(
          externalReference,
        );
      if (!resultados.length) return false;

      const pagoAprobado = [...resultados]
        .reverse()
        .find((r) => r.status === 'approved');
      const candidato = pagoAprobado ?? resultados[resultados.length - 1];
      if (!candidato?.id) return false;

      if (
        candidato.status === 'approved' ||
        candidato.status === 'rejected' ||
        candidato.status === 'cancelled'
      ) {
        await this.procesarWebhook(candidato.id, pago.id_pago);
        return true;
      }
    } catch (error: unknown) {
      this.logger.warn(
        `No se pudo reconciliar el pago pendiente #${pago.id_pago} (${externalReference}) con Mercado Pago:`,
        error,
      );
    }

    return false;
  }

  /**
   * Reconcilia todos los pagos en estado 'Pendiente' de un usuario contra Mercado Pago.
   * Deduplica ejecuciones concurrentes para el mismo usuario.
   */
  async sincronizarPagosPendientesUsuario(id_usuario: number): Promise<void> {
    if (!this.pagosRepository.obtenerPagosPendientesPorUsuario) return;

    const existente = this.syncUsuariosEnCurso.get(id_usuario);
    if (existente) {
      await existente;
      return;
    }

    const tarea = (async () => {
      try {
        const pendientes =
          await this.pagosRepository.obtenerPagosPendientesPorUsuario(
            id_usuario,
          );
        for (const pago of pendientes) {
          await this.sincronizarPagoPendientePorReferencia(pago);
        }
      } catch (error: unknown) {
        this.logger.warn(
          `Error al sincronizar pagos pendientes del usuario #${id_usuario}:`,
          error,
        );
      } finally {
        this.syncUsuariosEnCurso.delete(id_usuario);
      }
    })();

    this.syncUsuariosEnCurso.set(id_usuario, tarea);
    await tarea;
  }

  /**
   * Obtiene la lista cronológica de pagos realizados por un socio
   */
  async obtenerHistorialUsuario(
    id_usuario: number,
  ): Promise<PagoDetalleResponseDto[]> {
    await this.sincronizarPagosPendientesUsuario(id_usuario);
    const pagos =
      await this.pagosRepository.obtenerHistorialPorUsuario(id_usuario);
    return pagos.map((pago) => this.formatearDetallePago(pago));
  }

  /**
   * Obtiene el detalle de un pago por su ID, valida su pertenencia y, si sigue
   * 'Pendiente', certifica y acredita el pago en línea contra Mercado Pago.
   */
  async obtenerDetallePago(
    id_pago: number,
    id_usuario: number,
  ): Promise<PagoDetalleResponseDto> {
    let pago = await this.pagosRepository.obtenerDetallePorId(id_pago);
    if (!pago) {
      throw new NotFoundException(`El pago #${id_pago} no existe.`);
    }

    const usuarioPago =
      pago.cancha_reserva?.id_usuario ?? pago.membresia?.id_usuario;
    if (usuarioPago !== id_usuario) {
      throw new ForbiddenException(
        'No tienes permisos para consultar este comprobante o pago.',
      );
    }

    if (esEstado(pago.pago_estado, PAGO_ESTADO.PENDIENTE)) {
      const reconciliado =
        await this.sincronizarPagoPendientePorReferencia(pago);
      if (reconciliado) {
        const pagoActualizado =
          await this.pagosRepository.obtenerDetallePorId(id_pago);
        if (pagoActualizado) {
          pago = pagoActualizado;
        }
      }
    }

    return this.formatearDetallePago(pago);
  }

  /**
   * Obtiene los conceptos que el usuario tiene pendientes de abonar:
   * - Su membresía, si está vencida o no activa y no fue renovada con un pago aprobado.
   * - Sus reservas de cancha futuras sin pago aprobado.
   */
  async obtenerPendientesUsuario(
    id_usuario: number,
  ): Promise<PagoPendienteResponseDto[]> {
    await this.sincronizarPagosPendientesUsuario(id_usuario);
    const pendientes: PagoPendienteResponseDto[] = [];

    const membresia =
      await this.pagosRepository.obtenerUltimaMembresiaDeUsuario(id_usuario);

    // Una membresía suspendida por el socio conserva beneficios hasta su
    // fecha_fin y nunca genera un pago pendiente.
    const suspendida = esEstado(
      membresia?.membresia_estado,
      MEMBRESIA_ESTADO.SUSPENDIDA,
    );

    if (membresia && !suspendida) {
      const estadoActiva = esEstado(
        membresia.membresia_estado,
        MEMBRESIA_ESTADO.ACTIVA,
      );
      const vencida = new Date(membresia.fecha_fin) < new Date();

      // La aprobación de un pago siempre deja la membresía 'Activa', por lo que
      // solo una membresía vencida necesita comprobar si ya fue renovada.
      const renovada =
        estadoActiva && vencida
          ? await this.pagosRepository.existePagoAprobadoDeMembresiaDesde(
              membresia.id_membresia,
              membresia.fecha_fin,
            )
          : false;

      if ((!estadoActiva || vencida) && !renovada) {
        const nombrePlan = membresia.membresia_plan?.nombre || 'Plan FitZone';
        const dias = membresia.membresia_plan?.duracion_dias || 30;
        const etiqueta = etiquetaPlan(dias);
        const finStr = new Date(membresia.fecha_fin).toLocaleDateString(
          'es-AR',
          {
            timeZone: 'UTC',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          },
        );

        pendientes.push({
          tipo: 'membresia',
          id_referencia: membresia.id_membresia,
          titulo: `Membresía ${nombrePlan}`,
          detalle: vencida
            ? `${etiqueta} • Venció el ${finStr}`
            : `${etiqueta} • Hasta ${finStr}`,
          monto: Math.round(Number(membresia.membresia_plan?.precio ?? 0)),
          duracion_dias: dias,
        });
      }
    }

    const reservas =
      await this.pagosRepository.obtenerReservasPendientesDePago(id_usuario);

    for (const r of reservas) {
      const nombreCancha = r.cancha?.nombre || 'Cancha Deportiva';
      const nombreSede = r.cancha?.sede?.nombre || 'Sede Central';
      const sedeLimpia = nombreSede.replace(/^Sede\s+/i, '');
      const fechaStr = new Date(r.fecha_inicio).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      const horaInicio = new Date(r.fecha_inicio).toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const horaFin = new Date(r.fecha_fin).toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      pendientes.push({
        tipo: 'cancha',
        id_referencia: r.id_cancha_reserva,
        titulo: `Reserva ${nombreCancha}`,
        detalle: `${sedeLimpia} • ${fechaStr} de ${horaInicio} a ${horaFin} hs`,
        monto: Math.round(Number(r.precio_congelado)),
      });
    }

    return pendientes;
  }
}
