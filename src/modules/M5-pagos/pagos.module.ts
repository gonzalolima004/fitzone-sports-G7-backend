import { Module } from '@nestjs/common';
import { MercadoPagoService } from './services/mercadopago.service';
import { PagosRepository } from './repositories/pagos.repository';
import { PagosService } from './services/pagos.service';
import { GeneradorPdfService } from './services/generador-pdf.service';
import { PagosController } from './controllers/pagos.controller';
import { WebhooksController } from './controllers/webhooks.controller';
import { ComprobantesController } from './controllers/comprobantes.controller';

@Module({
  controllers: [PagosController, WebhooksController, ComprobantesController],
  providers: [
    MercadoPagoService,
    PagosRepository,
    PagosService,
    GeneradorPdfService,
  ],
  exports: [
    MercadoPagoService,
    PagosRepository,
    PagosService,
    GeneradorPdfService,
  ],
})
export class PagosModule {}
