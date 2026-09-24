import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { MercadoPagoService } from './mercadopago.service';
import { GeneradorPdfService } from './generador-pdf.service';
import {
  PagosRepository,
  PagoConRelaciones,
} from '../repositories/pagos.repository';
import { IniciarPagoDto } from '../dto/iniciar-pago.dto';
import { PreferenciaPagoResponseDto } from '../dto/preferencia-pago-response.dto';
import {
  ComprobanteItemDto,
  ComprobanteResponseDto,
} from '../dto/comprobante-response.dto';

@Injectable()
export class PagosService {
  private readonly logger = new Logger(PagosService.name);

  constructor(
    private readonly mercadopagoService: MercadoPagoService,
    private readonly pagosRepository: PagosRepository,
    private readonly generadorPdfService: GeneradorPdfService,
  ) {}

  /**
   * Crea una preferencia de pago en Mercado Pago (Checkout Pro) y persiste
   * la intención de pago en la base de datos con estado Pendiente.
   */
  async crearPreferenciaPago(
    dto: IniciarPagoDto,
    emailUsuario?: string,
  ): Promise<PreferenciaPagoResponseDto> {
    // 1. Validar concepto único: exactamente una entidad asociada
    const tieneCancha =
      dto.id_cancha_reserva !== undefined && dto.id_cancha_reserva !== null;
    const tieneMembresia =
      dto.id_membresia !== undefined && dto.id_membresia !== null;

    if ((tieneCancha && tieneMembresia) || (!tieneCancha && !tieneMembresia)) {
      throw new BadRequestException(
        'Debe asociar el pago exactamente a una reserva de cancha o a una membresía.',
      );
    }

    // 2. Verificar existencia de la entidad en la base de datos
    if (tieneCancha) {
      const existe = await this.pagosRepository.existeCanchaReserva(
        dto.id_cancha_reserva!,
      );
      if (!existe) {
        throw new NotFoundException(
          `La reserva de cancha #${dto.id_cancha_reserva} no existe.`,
        );
      }
    }

    if (tieneMembresia) {
      const existe = await this.pagosRepository.existeMembresia(
        dto.id_membresia!,
      );
      if (!existe) {
        throw new NotFoundException(
          `La membresía #${dto.id_membresia} no existe.`,
        );
      }
    }

    // 3. Obtener el ID del estado 'Pendiente' en pago_estado
    const idPagoEstado = await this.pagosRepository.obtenerEstadoPendienteId();

    // 4. Invocar el SDK oficial de Mercado Pago para crear la preferencia
    const itemId = tieneCancha
      ? `cancha-${dto.id_cancha_reserva}`
      : `membresia-${dto.id_membresia}`;
    const payerEmail =
      emailUsuario || dto.email_pagador || 'cliente@fitzone.com';
    const backUrls = this.mercadopagoService.backUrls;
    const notificationUrl = this.mercadopagoService.notificationUrl;

    const preference = await this.mercadopagoService.preference
      .create({
        body: {
          items: [
            {
              id: itemId,
              title: dto.titulo,
              quantity: 1,
              unit_price: Number(dto.monto),
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
          auto_return: backUrls?.success ? 'approved' : undefined,
          notification_url: notificationUrl || undefined,
          external_reference: itemId,
          metadata: {
            id_cancha_reserva: dto.id_cancha_reserva ?? null,
            id_membresia: dto.id_membresia ?? null,
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

    // 5. Persistir la intención en la tabla `pago` con estado 'Pendiente'
    // RNF-02: Se almacena solo el ID en token_transaccion, sin datos sensibles de tarjeta.
    const nuevoPago = await this.pagosRepository.crearPago({
      id_pago_estado: idPagoEstado,
      id_cancha_reserva: dto.id_cancha_reserva ?? null,
      id_membresia: dto.id_membresia ?? null,
      monto: dto.monto,
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
   * Procesa la notificación de un webhook de pago emitido por Mercado Pago
   * 1. Consulta y certifica el estado real en los servidores de Mercado Pago (Payment.get).
   * 2. Localiza el registro del pago en la base de datos.
   * 3. Garantiza idempotencia: si el pago ya está 'Aprobado', omite la transacción sin error.
   * 4. Si el estado es 'approved', ejecuta la confirmación atómica con $transaction.
   * 5. Si el estado es 'rejected' o 'cancelled', marca el pago como 'Rechazado'.
   */
  async procesarWebhook(paymentId: string | number) {
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
    const estadoActual = pago.pago_estado?.descripcion?.toLowerCase();
    if (estadoActual === 'aprobado') {
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
      const idEstadoAprobado =
        await this.pagosRepository.obtenerEstadoAprobadoId();
      const idEstadoReservaConfirmada =
        await this.pagosRepository.obtenerEstadoReservaConfirmadaId();
      const idEstadoMembresiaActiva =
        await this.pagosRepository.obtenerEstadoMembresiaActivaId();

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
        });

      this.logger.log(
        `Pago #${pagoConfirmado.id_pago} confirmado atómicamente ($transaction) con estado 'Aprobado'. Servicio asociado actualizado.`,
      );

      return {
        received: true,
        status: 'approved',
        message: `Pago #${pago.id_pago} aprobado y confirmado exitosamente`,
      };
    }

    if (mpStatus === 'rejected' || mpStatus === 'cancelled') {
      const idEstadoRechazado =
        await this.pagosRepository.obtenerEstadoRechazadoId();
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
  ): Promise<ComprobanteResponseDto> {
    const pago =
      await this.pagosRepository.obtenerPagoCompletoParaComprobante(id_pago);

    if (!pago) {
      throw new NotFoundException(`El pago #${id_pago} no fue encontrado.`);
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
      const fechaStr = new Date(r.fecha_inicio).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      const horaInicio = new Date(r.fecha_inicio).toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const horaFin = new Date(r.fecha_fin).toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      });

      items.push({
        concepto: `Reserva ${nombreCancha}`,
        detalle: `Sede ${nombreSede} - Horario: ${fechaStr} ${horaInicio} a ${horaFin} hs`,
        cantidad: 1,
        precio_unitario: Number(pago.monto),
        subtotal: Number(pago.monto),
      });
    } else if (pago.membresia) {
      const m = pago.membresia;
      const nombrePlan = m.membresia_plan?.nombre || 'Plan FitZone';
      const dias = m.membresia_plan?.duracion_dias || 30;
      const inicioStr = new Date(m.fecha_inicio).toLocaleDateString('es-AR');
      const finStr = new Date(m.fecha_fin).toLocaleDateString('es-AR');

      items.push({
        concepto: `Membresía ${nombrePlan}`,
        detalle: `Vigencia: ${inicioStr} al ${finStr} (${dias} días)`,
        cantidad: 1,
        precio_unitario: Number(pago.monto),
        subtotal: Number(pago.monto),
      });
    } else {
      items.push({
        concepto: 'Servicio Deportivo FitZone',
        detalle: 'Abono general registrado',
        cantidad: 1,
        precio_unitario: Number(pago.monto),
        subtotal: Number(pago.monto),
      });
    }

    const nroTicket = `FZ-PAGO-${String(pago.id_pago).padStart(8, '0')}`;
    const montoTotal = Number(pago.monto);

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
  async generarComprobantePdf(id_pago: number): Promise<Buffer> {
    const datos = await this.obtenerDatosComprobante(id_pago);
    return this.generadorPdfService.generarComprobante(datos);
  }
}
