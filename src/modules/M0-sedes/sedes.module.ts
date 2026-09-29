import { Module } from '@nestjs/common';
import { CiudadController } from './controllers/ciudad.controller';
import { SedeController } from './controllers/sede.controller';
import { CiudadService } from './services/ciudad.service';
import { SedeService } from './services/sede.service';
import { CiudadRepository } from './repositories/ciudad.repository';
import { SedeRepository } from './repositories/sede.repository';

@Module({
  controllers: [CiudadController, SedeController],
  providers: [CiudadService, CiudadRepository, SedeService, SedeRepository],
  exports: [CiudadService, SedeService],
})
export class SedesModule {}
