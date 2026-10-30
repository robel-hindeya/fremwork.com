import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** Service-role Supabase client. Bypasses RLS, so every route that uses it must do its own checks. */
@Injectable()
export class SupabaseService {
  readonly db: SupabaseClient;

  constructor(config: ConfigService) {
    const url = config.get<string>('SUPABASE_URL');
    const key = config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (see apps/api/.env.example)');
    this.db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  }

  /** Unwraps a Supabase response or throws a 500 with the database message. */
  static check<T>(res: { data: T; error: { message: string } | null }): T {
    if (res.error) throw new InternalServerErrorException(res.error.message);
    return res.data;
  }
}
