import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QrController } from './controllers/qr.controller';
import { QrService } from './services/qr.service';
import { UserRepository } from './repositories/user.repository';
import { PrismaModule } from '../../database/prisma-service/prisma.module';
@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [QrController],
  providers: [QrService, UserRepository],
  exports: [QrService],
})
export class AccesosModule {}
