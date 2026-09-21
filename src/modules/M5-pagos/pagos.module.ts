import { Module } from '@nestjs/common';
import { MercadoPagoService } from './services/mercadopago.service';
import { PagosRepository } from './repositories/pagos.repository';

@Module({
  providers: [MercadoPagoService, PagosRepository],
  exports: [MercadoPagoService, PagosRepository],
})
export class PagosModule {}
