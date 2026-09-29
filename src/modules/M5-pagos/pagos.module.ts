import { Module } from '@nestjs/common';
import { MercadoPagoService } from './services/mercadopago.service';
import { PagosRepository } from './repositories/pagos.repository';
import { PagosService } from './services/pagos.service';
import { PagosController } from './controllers/pagos.controller';
import { WebhooksController } from './controllers/webhooks.controller';

@Module({
  controllers: [PagosController, WebhooksController],
  providers: [MercadoPagoService, PagosRepository, PagosService],
  exports: [MercadoPagoService, PagosRepository, PagosService],
})
export class PagosModule {}
