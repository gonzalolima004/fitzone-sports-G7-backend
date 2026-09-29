import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

type SupabaseClientInstance = ReturnType<typeof createClient>;

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private client!: SupabaseClientInstance;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const supabaseUrl = this.configService.get<string>('database_url');
    const serviceRoleKey = this.configService.get<string>('supabase_anon_key');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        'Las variables SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar definidas.',
      );
    }

    this.client = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    this.logger.log('Cliente de Supabase inicializado correctamente.');
  }

  getClient(): SupabaseClient {
    return this.client;
  }
}
