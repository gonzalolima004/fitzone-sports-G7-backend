import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../../common/supabase/supabase.service';

export class TurnoReservadoEventDto {
  id_cancha: number;
  fecha: string; // YYYY-MM-DD
  hora_inicio: string; // HH:mm
  hora_fin: string; // HH:mm
}

@Injectable()
export class CanchasRealtimeService {
  private readonly logger = new Logger(CanchasRealtimeService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Notifica en tiempo real vía Supabase Realtime Broadcast que se reservó un turno
   * en una cancha de una sede, para que los usuarios conectados actualicen su grilla.
   */
  async notificarTurnoReservado(
    idSede: number,
    data: TurnoReservadoEventDto,
  ): Promise<void> {
    const canal = `canchas:sede:${idSede}`;
    const evento = 'turno_reservado';

    try {
      this.logger.log(
        `Emitiendo broadcast [${evento}] en canal [${canal}] para cancha ${data.id_cancha} (${data.fecha} ${data.hora_inicio}-${data.hora_fin})`,
      );

      await this.supabaseService.emitRealtimeEvent(canal, evento, {
        id_cancha: data.id_cancha,
        fecha: data.fecha,
        hora_inicio: data.hora_inicio,
        hora_fin: data.hora_fin,
      });

      this.logger.log(
        `Broadcast [${evento}] emitido exitosamente en canal [${canal}]`,
      );
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error al emitir evento realtime [${evento}] en canal [${canal}]: ${errorMsg}`,
      );
      // No relanzamos el error para no abortar ni afectar la respuesta HTTP de la reserva en la BD
    }
  }
}
