import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  WebhookSignatureValidator,
  InvalidWebhookSignatureError,
} from 'mercadopago';
import { PagosService } from '../services/pagos.service';
import { MercadoPagoService } from '../services/mercadopago.service';
import { MercadoPagoWebhookDto } from '../dto/mercadopago-webhook.dto';
import { WebhookResponseDto } from '../dto/webhook-response.dto';

interface WebhookQueryParams {
  topic?: string;
  type?: string;
  id?: string;
  'data.id'?: string;
}

@ApiTags('Pagos y Facturación')
@Controller('pagos')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly pagosService: PagosService,
    private readonly mercadopagoService: MercadoPagoService,
  ) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Recibir notificaciones Webhook e IPN de Mercado Pago',
    description:
      'Endpoint público sin autenticación que procesa los eventos de pago de Mercado Pago Checkout Pro y confirma transacciones en tiempo real de forma atómica e idempotente (RF-13).',
  })
  @ApiResponse({
    status: 200,
    description:
      'Notificación recibida y procesada correctamente por el backend.',
    type: WebhookResponseDto,
  })
  async recibirWebhook(
    @Body() dto: MercadoPagoWebhookDto,
    @Query() query: WebhookQueryParams,
    @Headers('x-signature') xSignature?: string,
    @Headers('x-request-id') xRequestId?: string,
  ): Promise<WebhookResponseDto> {
    this.logger.log(
      `Webhook recibido de Mercado Pago. Tipo: '${dto.type || query.type || query.topic}', Acción: '${dto.action || 'n/a'}'`,
    );

    // 1. Extraer el identificador del pago considerando Webhooks V2 e IPN tradicional
    const paymentId =
      dto?.data?.id ||
      query['data.id'] ||
      (query.topic === 'payment' || query.type === 'payment'
        ? query.id
        : undefined) ||
      (dto.type === 'payment' || dto.topic === 'payment' ? dto.id : undefined);

    // 2. Validación de firma criptográfica oficial (HMAC-SHA256) si webhookSecret y x-signature están presentes
    const secret = this.mercadopagoService.webhookSecret;
    if (secret && xSignature) {
      try {
        WebhookSignatureValidator.validate({
          xSignature,
          xRequestId: xRequestId || null,
          dataId: paymentId ? String(paymentId) : query['data.id'] || null,
          secret,
        });
        this.logger.log(
          'Firma x-signature de Mercado Pago validada exitosamente.',
        );
      } catch (err: unknown) {
        if (err instanceof InvalidWebhookSignatureError) {
          this.logger.warn(
            `Firma de Webhook de Mercado Pago inválida: ${err.message}`,
          );
          return {
            received: false,
            status: 'unauthorized',
            message: 'Firma de webhook inválida',
          };
        }
      }
    }

    // 3. Si no se identifica un evento de tipo pago, responder 200 OK reconociendo el evento
    if (!paymentId) {
      this.logger.log(
        'La notificación no contiene un ID de pago o corresponde a otro recurso (ej. merchant_order). Evento reconocido.',
      );
      return {
        received: true,
        status: 'ignored',
        message: 'Evento reconocido pero no aplicable a pagos de FitZone',
      };
    }

    // 3. Procesar el pago de forma atómica e idempotente
    try {
      const resultado = await this.pagosService.procesarWebhook(paymentId);
      return {
        received: true,
        status: resultado.status,
        message: resultado.message,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Error durante el procesamiento del webhook para el pago #${paymentId}:`,
        error,
      );
      // Responder siempre 200 OK a Mercado Pago para evitar loops infinitos de reintentos
      return {
        received: true,
        status: 'error',
        message: 'Error al procesar el pago, registrado para auditoría',
      };
    }
  }
}
