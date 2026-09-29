import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseService } from './supabase.service';
import supabaseConfig from '../../config/supabase.config';

@Global()
@Module({
  imports: [ConfigModule.forFeature(supabaseConfig)],
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
