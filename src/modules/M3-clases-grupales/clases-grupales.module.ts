import { Module } from '@nestjs/common';
import { ClasesController } from './controllers/clases.controller';
import { ReservasClasesController } from './controllers/reservas-clases.controller';
import { ClasesService } from './services/clases.service';
import { ReservasClasesService } from './services/reservas-clases.service';
import { SupabaseService } from './services/supabase.service';
import { ClasesRepository } from './repositories/clases.repository';
import { ReservasClasesRepository } from './repositories/reservas-clases.repository';
import { ListaEsperaSubject } from './patterns/observer/lista-espera.subject';
import { NotificacionRealtimeObserver } from './patterns/observer/notificacion-realtime.observer';

@Module({
  controllers: [ClasesController, ReservasClasesController],
  providers: [
    ClasesService,
    ReservasClasesService,
    SupabaseService,
    ClasesRepository,
    ReservasClasesRepository,
    ListaEsperaSubject,
    NotificacionRealtimeObserver,
  ],
  exports: [ClasesService, ReservasClasesService],
})
export class ClasesGrupalesModule {}
