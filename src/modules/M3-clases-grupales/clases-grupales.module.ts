import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma-service/prisma.module';
import { ClasesController } from './controllers/clases.controller';
import { ReservasClasesController } from './controllers/reservas-clases.controller';
import { ListaEsperaController } from './controllers/lista-espera.controller';
import { ClasesService } from './services/clases.service';
import { ReservasClasesService } from './services/reservas-clases.service';
import { ListaEsperaService } from './services/lista-espera.service';
import { SupabaseService } from './services/supabase.service';
import { ClasesRepository } from './repositories/clases.repository';
import { ReservasClasesRepository } from './repositories/reservas-clases.repository';
import { ListaEsperaRepository } from './repositories/lista-espera.repository';
import { ListaEsperaSubject } from './patterns/observer/lista-espera.subject';
import { NotificacionRealtimeObserver } from './patterns/observer/notificacion-realtime.observer';

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
    SupabaseService,
    ClasesRepository,
    ReservasClasesRepository,
    ListaEsperaRepository,
    ListaEsperaSubject,
    NotificacionRealtimeObserver,
  ],
  exports: [
    ClasesService,
    ReservasClasesService,
    ListaEsperaService,
  ],
})
export class ClasesGrupalesModule {}
