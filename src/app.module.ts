import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database/prisma-service/prisma.module';
import { AccesosModule } from './modules/M2-accesos/accesos.module';

@Module({
  imports: [PrismaModule, AccesosModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
