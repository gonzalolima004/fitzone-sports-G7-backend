import { Module } from '@nestjs/common';
import { CiudadController } from './controllers/ciudad.controller';
import { SedeController } from './controllers/sede.controller';
import { CalendarioController } from './controllers/calendario.controller';
import { CiudadService } from './services/ciudad.service';
import { SedeService } from './services/sede.service';
import { CalendarioService } from './services/calendario.service';
import { CiudadRepository } from './repositories/ciudad.repository';
import { SedeRepository } from './repositories/sede.repository';
import { CalendarioRepository } from './repositories/calendario.repository';

@Module({
  controllers: [CiudadController, SedeController, CalendarioController],
  providers: [
    CiudadService,
    CiudadRepository,
    SedeService,
    SedeRepository,
    CalendarioService,
    CalendarioRepository,
  ],
  exports: [CiudadService, SedeService],
})
export class SedesModule {}
