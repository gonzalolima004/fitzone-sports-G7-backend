import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QrController } from './controllers/qr.controller';
import { AccesosController } from './controllers/accesos.controller';
import { QrService } from './services/qr.service';
import { AccesosService } from './services/accesos.service';
import { AforoRealtimeService } from './services/aforo-realtime.service';
import { UserRepository } from './repositories/user.repository';
import { AccesosRepository } from './repositories/accesos.repository';
import { PrismaModule } from '../../database/prisma-service/prisma.module';
import { SupabaseModule } from '../../common/supabase/supabase.module';

@Module({
  imports: [ConfigModule, PrismaModule, SupabaseModule],
  controllers: [QrController, AccesosController],
  providers: [
    QrService,
    UserRepository,
    AccesosService,
    AforoRealtimeService,
    AccesosRepository,
  ],
  exports: [QrService, AccesosService, AforoRealtimeService],
})
export class AccesosModule {}
