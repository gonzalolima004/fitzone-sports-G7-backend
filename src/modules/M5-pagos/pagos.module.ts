import { Module } from '@nestjs/common';
import { MercadoPagoService } from './services/mercadopago.service';

@Module({
  providers: [MercadoPagoService],
  exports: [MercadoPagoService],
})
export class PagosModule {}
