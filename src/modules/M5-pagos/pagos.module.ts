import { Module } from '@nestjs/common';
import { MercadoPagoService } from './services/mercadopago.service';
import { PagosRepository } from './repositories/pagos.repository';
import { PagosService } from './services/pagos.service';

@Module({
  providers: [MercadoPagoService, PagosRepository, PagosService],
  exports: [MercadoPagoService, PagosRepository, PagosService],
})
export class PagosModule {}
