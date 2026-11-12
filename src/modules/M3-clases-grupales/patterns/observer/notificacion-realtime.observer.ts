import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import {
  ListaEsperaObserver,
  VacanteLiberadaEvento,
} from './lista-espera-observer.interface';
import { SupabaseService } from '../../../../common/supabase/supabase.service';
import { ListaEsperaSubject } from './lista-espera.subject';
import { ClasesRealtimeService } from '../../services/clases-realtime.service';

@Injectable()
export class NotificacionRealtimeObserver
  implements ListaEsperaObserver, OnModuleInit
{
  private readonly logger = new Logger(NotificacionRealtimeObserver.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly subject: ListaEsperaSubject,
    @Optional() private readonly clasesRealtime?: ClasesRealtimeService,
  ) {}

  onModuleInit() {
    this.subject.attach(this);
    this.logger.log('Observer de Supabase adjuntado a la Lista de Espera');
  }

  async update(evento: VacanteLiberadaEvento): Promise<void> {
    this.logger.log(
      `Procesando evento de vacante liberada para clase ${evento.id_clase}`,
    );

    try {
      // Si el servicio especializado de Realtime está disponible y el evento contiene metadatos completos, delegar
      if (this.clasesRealtime) {
        await this.clasesRealtime.notificarVacanteLiberada(evento);
        return;
      }

      // Fallback directo a SupabaseService con emisiones concurrentes vía Promise.all
      const promesas: Promise<void>[] = [
        this.supabaseService.emitRealtimeEvent(
          `clases:espera:${evento.id_clase}`,
          'vacante_liberada',
          {
            id_clase: evento.id_clase,
            fecha_inicio: evento.fecha_inicio,
            fecha_fin: evento.fecha_fin,
            mensaje:
              evento.mensaje || '¡Una vacante se ha liberado en esta clase!',
            ...(evento.id_sede ? { id_sede: evento.id_sede } : {}),
            ...(evento.nombre_clase
              ? { nombre_clase: evento.nombre_clase }
              : {}),
          },
        ),
      ];

      if (evento.id_sede) {
        promesas.push(
          this.supabaseService.emitRealtimeEvent(
            `clases:sede:${evento.id_sede}`,
            'vacante_liberada',
            {
              id_clase: evento.id_clase,
              id_sede: evento.id_sede,
              nombre_clase: evento.nombre_clase,
              fecha_inicio: evento.fecha_inicio,
              fecha_fin: evento.fecha_fin,
              mensaje:
                evento.mensaje || '¡Una vacante se ha liberado en esta clase!',
            },
          ),
        );
      }

      if (evento.id_usuario_promovido) {
        this.logger.log(
          `Notificando al usuario promovido ID: ${evento.id_usuario_promovido}`,
        );
        promesas.push(
          this.supabaseService.emitRealtimeEvent(
            `usuarios:${evento.id_usuario_promovido}:notificaciones`,
            'promocion_lista_espera',
            {
              mensaje:
                evento.mensaje ||
                '¡Se ha liberado un cupo y se te ha asignado la vacante!',
              clase: evento.id_clase,
              id_clase: evento.id_clase,
              ...(evento.nombre_clase
                ? { nombre_clase: evento.nombre_clase }
                : {}),
              ...(evento.id_sede ? { id_sede: evento.id_sede } : {}),
              ...(evento.profesor ? { profesor: evento.profesor } : {}),
              ...(evento.sala ? { sala: evento.sala } : {}),
              fecha_inicio: evento.fecha_inicio,
              fecha_fin: evento.fecha_fin,
            },
          ),
        );
      }

      await Promise.all(promesas);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error al emitir evento de vacante liberada para clase ${evento.id_clase}: ${errorMsg}`,
      );
    }
  }
}
