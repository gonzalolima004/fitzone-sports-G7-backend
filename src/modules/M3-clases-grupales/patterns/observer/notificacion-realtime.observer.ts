import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  ListaEsperaObserver,
  VacanteLiberadaEvento,
} from './lista-espera-observer.interface';
import { SupabaseService } from '../../services/supabase.service';
import { ListaEsperaSubject } from './lista-espera.subject';

@Injectable()
export class NotificacionRealtimeObserver
  implements ListaEsperaObserver, OnModuleInit
{
  private readonly logger = new Logger(NotificacionRealtimeObserver.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly subject: ListaEsperaSubject,
  ) {}

  onModuleInit() {
    this.subject.attach(this);
    this.logger.log('Observer de Supabase adjuntado a la Lista de Espera');
  }

  async update(evento: VacanteLiberadaEvento): Promise<void> {
    this.logger.log(
      `Procesando evento de vacante liberada para clase ${evento.id_clase}`,
    );

    // Emitir evento al canal global de la clase indicando que hay una nueva vacante
    // Cualquier usuario en la sala de espera de la app podría ver esto y actualizar su estado visual
    await this.supabaseService.emitRealtimeEvent(
      `clases:espera:${evento.id_clase}`,
      'vacante_liberada',
      {
        id_clase: evento.id_clase,
        fecha_inicio: evento.fecha_inicio,
        fecha_fin: evento.fecha_fin,
        mensaje: '¡Una vacante se ha liberado en esta clase!',
      },
    );

    if (evento.id_usuario_promovido) {
      this.logger.log(
        `Notificando al usuario promovido ID: ${evento.id_usuario_promovido}`,
      );
      await this.supabaseService.emitRealtimeEvent(
        `usuarios:${evento.id_usuario_promovido}:notificaciones`,
        'promocion_lista_espera',
        {
          mensaje: '¡Se ha liberado un cupo y se te ha asignado la vacante!',
          clase: evento.id_clase,
        },
      );
    }
  }
}
