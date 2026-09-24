import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { MercadoPagoService } from './mercadopago.service';
import { PagosRepository } from '../repositories/pagos.repository';
import { IniciarPagoDto } from '../dto/iniciar-pago.dto';
import { PreferenciaPagoResponseDto } from '../dto/preferencia-pago-response.dto';

@Injectable()
export class PagosService {
  private readonly logger = new Logger(PagosService.name);

  constructor(
    private readonly mercadopagoService: MercadoPagoService,
    private readonly pagosRepository: PagosRepository,
  ) {}

  /**
   * Crea una preferencia de pago en Mercado Pago (Checkout Pro) y persiste
   * la intención de pago en la base de datos con estado Pendiente (RF-13, RNF-02).
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
}
