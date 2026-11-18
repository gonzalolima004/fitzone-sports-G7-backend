import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, User, AuthError } from '@supabase/supabase-js';

type SupabaseClientInstance = ReturnType<typeof createClient>;

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private readonly client: SupabaseClientInstance;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl =
      this.configService.get<string>('SUPABASE_URL') ||
      this.configService.get<string>('supabase.url');
    const supabaseKey =
      this.configService.get<string>('SUPABASE_ANON_KEY') ||
      this.configService.get<string>('supabase.anonKey') ||
      this.configService.get<string>('SUPABASE_PUBLISHABLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Faltan variables de entorno requeridas para Supabase (SUPABASE_URL y SUPABASE_ANON_KEY).',
      );
    }

    this.client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    this.logger.log('Cliente de Supabase inicializado correctamente.');
  }

  getClient(): SupabaseClientInstance {
    return this.client;
  }

  async getUser(
    token: string,
  ): Promise<{ user: User | null; error: AuthError | null }> {
    const {
      data: { user },
      error,
    } = await this.client.auth.getUser(token);
    return { user, error };
  }

  async emitRealtimeEvent(
    channelName: string,
    event: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const channel = this.client.channel(channelName);

      channel.subscribe((status: string, err?: Error) => {
        if (err) {
          this.logger.error(
            `Error al suscribirse al canal Realtime [${channelName}]: ${err.message}`,
          );
          void this.client.removeChannel(channel);
          return reject(err);
        }

        if (status === 'SUBSCRIBED') {
          channel
            .send({
              type: 'broadcast',
              event,
              payload,
            })
            .then(() => {
              // Dejar un intervalo controlado (500ms) para asegurar que el mensaje
              // sea transmitido por el WebSocket antes de remover el canal.
              const timer = setTimeout(() => {
                void this.client.removeChannel(channel);
              }, 500);
              if (typeof timer.unref === 'function') {
                timer.unref();
              }
              resolve();
            })
            .catch((sendError: unknown) => {
              const errorMsg =
                sendError instanceof Error
                  ? sendError.message
                  : String(sendError);
              this.logger.error(
                `Error al enviar broadcast en canal [${channelName}]: ${errorMsg}`,
              );
              void this.client.removeChannel(channel);
              reject(
                sendError instanceof Error
                  ? sendError
                  : new Error(String(sendError)),
              );
            });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          this.logger.error(
            `Fallo de suscripción en canal Realtime [${channelName}] con estado: ${status}`,
          );
          void this.client.removeChannel(channel);
          reject(
            new Error(`Fallo al suscribirse al canal Realtime: ${status}`),
          );
        }
      });
    });
  }
}
