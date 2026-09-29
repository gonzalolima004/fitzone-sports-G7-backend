// src/config/supabase.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('supabase', () => ({
  url: process.env.DATABASE_URL,
  serviceRoleKey: process.env.SUPABASE_ANON_KEY,
}));
