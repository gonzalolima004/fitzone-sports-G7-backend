import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma-service/prisma.module';
import { ClasesController } from './controllers/clases.controller';
import { ReservasClasesController } from './controllers/reservas-clases.controller';
import { ClasesService } from './services/clases.service';
import { ReservasClasesService } from './services/reservas-clases.service';
import { ClasesRepository } from './repositories/clases.repository';
import { ReservasClasesRepository } from './repositories/reservas-clases.repository';
import { ListaEsperaController } from './controllers/lista-espera.controller';
import { ListaEsperaService } from './services/lista-espera.service';
import { ListaEsperaRepository } from './repositories/lista-espera.repository';

@Module({
  imports: [PrismaModule],
  controllers: [
    ClasesController,
    ReservasClasesController,
    ListaEsperaController,
  ],
  providers: [
    ClasesService,
    ReservasClasesService,
    ListaEsperaService,
    ClasesRepository,
    ReservasClasesRepository,
    ListaEsperaRepository,
  ],
  exports: [ClasesService, ReservasClasesService, ListaEsperaService],
})
export class ClasesGrupalesModule {}
