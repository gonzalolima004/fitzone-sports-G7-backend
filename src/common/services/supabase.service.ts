import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly client: ReturnType<typeof createClient>;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>(
      'SUPABASE_PUBLISHABLE_KEY',
    );

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Falta configuracion Supabase');
    }
    this.client = createClient(supabaseUrl, supabaseKey);
  }

  async getUser(token: string) {
    const {
      data: { user },
      error,
    } = await this.client.auth.getUser(token);

    return { user, error };
  }
}
