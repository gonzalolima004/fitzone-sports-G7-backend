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
  async emitirAforo(
    idSede: number,
    estadoAforo: AforoStatusResponseDto,
  ): Promise<void> {
    const channelName = `aforo:sede:${idSede}`;
    const client = this.supabaseService.getClient();

    const channel = client.channel(channelName);

    await channel.send({
      type: 'broadcast',
      event: 'aforo_actualizado',
      payload: {
        idSede: estadoAforo.idSede,
        aforoActual: estadoAforo.aforoActual,
        aforoMaximo: estadoAforo.aforoMaximo,
      },
    });

    await client.removeChannel(channel);
    this.logger.log(`Aforo transmitido vía Realtime para la sede: ${idSede}`);
  }
}
