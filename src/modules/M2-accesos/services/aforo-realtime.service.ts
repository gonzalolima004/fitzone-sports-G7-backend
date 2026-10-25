import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../../common/supabase/supabase.service';
import { AforoStatusResponseDto } from '../dto/aforo-status-response.dto';

@Injectable()
export class AforoRealtimeService {
  private readonly logger = new Logger(AforoRealtimeService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Transmite el estado del aforo en tiempo real vía Supabase Broadcast
   */
  emitirAforo(idSede: number, estadoAforo: AforoStatusResponseDto): void {
    const channelName = `aforo:sede:${idSede}`;
    const client = this.supabaseService.getClient();

    const channel = client.channel(channelName);

    // Nos suscribimos temporalmente manejando la promesa de forma síncrona para void
    channel.subscribe((status: string) => {
      this.logger.debug(`Estado de suscripción del canal broadcast: ${status}`);

      if (status === 'SUBSCRIBED') {
        const payloadData = {
          idSede: estadoAforo.idSede,
          aforoActual: estadoAforo.aforoActual,
          aforoMaximo: estadoAforo.aforoMaximo,
        };

        this.logger.log(
          `Enviando broadcast en canal [${channelName}] con datos: ${JSON.stringify(payloadData)}`,
        );

        // Ejecutamos la promesa de forma controlada sin retornar directamente en el callback void
        void channel.send({
          type: 'broadcast',
          event: 'aforo_actualizado',
          payload: payloadData,
        });

        // Limpiamos la conexión del canal una vez enviado
        setTimeout(() => {
          void client.removeChannel(channel).then(() => {
            this.logger.log(
              `Canal cerrado correctamente para la sede: ${idSede}`,
            );
          });
        }, 500);
      }
    });
  }
}
