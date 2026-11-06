import { Module } from '@nestjs/common';
import { CiudadController } from './controllers/ciudad.controller';
import { SedeController } from './controllers/sede.controller';
import { CalendarioController } from './controllers/calendario.controller';
import { CalendarioSedeController } from './controllers/calendario-sede.controller';
import { SedeHorarioController } from './controllers/sede-horario.controller';
import { CiudadService } from './services/ciudad.service';
import { SedeService } from './services/sede.service';
import { CalendarioService } from './services/calendario.service';
import { CalendarioSedeService } from './services/calendario-sede.service';
import { SedeHorarioService } from './services/sede-horario.service';
import { CiudadRepository } from './repositories/ciudad.repository';
import { SedeRepository } from './repositories/sede.repository';
import { CalendarioRepository } from './repositories/calendario.repository';
import { CalendarioSedeRepository } from './repositories/calendario-sede.repository';
import { SedeHorarioRepository } from './repositories/sede-horario.repository';

@Module({
  controllers: [
    CiudadController,
    SedeController,
    CalendarioController,
    CalendarioSedeController,
    SedeHorarioController,
  ],
  providers: [
    CiudadService,
    CiudadRepository,
    SedeService,
    SedeRepository,
    CalendarioService,
    CalendarioRepository,
    CalendarioSedeService,
    CalendarioSedeRepository,
    SedeHorarioService,
    SedeHorarioRepository,
  ],
  exports: [CiudadService, SedeService],
})
export class SedesModule {}
