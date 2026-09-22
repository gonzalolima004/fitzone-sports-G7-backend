import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import mercadopagoConfig from './config/mercadopago.config';
import { PrismaModule } from './database/prisma-service/prisma.module';
import { AccesosModule } from './modules/M2-accesos/accesos.module';
import { PagosModule } from './modules/M5-pagos/pagos.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [mercadopagoConfig],
    }),
    PrismaModule,
    AccesosModule,
    PagosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
