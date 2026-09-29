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
    const channel = this.client.channel(channelName);
    await channel.send({
      type: 'broadcast',
      event,
      payload,
    });
    await this.client.removeChannel(channel);
  }
}
