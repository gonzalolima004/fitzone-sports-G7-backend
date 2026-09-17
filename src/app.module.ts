import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CanchasModule } from './modules/M4-canchas/canchas.module';

@Module({
  imports: [CanchasModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
