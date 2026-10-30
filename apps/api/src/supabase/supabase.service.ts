import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** Service-role Supabase client. Bypasses RLS, so every route that uses it must do its own checks. */
@Injectable()
export class SupabaseService {
  readonly db: SupabaseClient;
  /** False when running on the publishable key: RLS then blocks every write the API makes. */
  readonly hasServiceKey: boolean;

  constructor(config: ConfigService) {
    // Fremwork's project. SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are NOT used: the Vercel Supabase
    // integration injects those for a different database.
    const url = config.get<string>('FREMWORK_SUPABASE_URL') || 'https://gwdrtfcqqnvhwolbjkab.supabase.co';
    const secret = config.get<string>('FREMWORK_SUPABASE_SECRET_KEY') || '';
    this.hasServiceKey = !!secret;
    if (!this.hasServiceKey) {
      console.error('FREMWORK_SUPABASE_SECRET_KEY is not set. Set it to the secret key of the Fremwork Supabase project.');
    }
    const key = secret || 'sb_publishable_jzmf0N9Uo3Q2ZYAfAIbWCg_xBzWttHY';
    this.db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  }

  /** Unwraps a Supabase response or throws a 500 with the database message. */
  static check<T>(res: { data: T; error: { message: string } | null }): T {
    if (res.error) throw new InternalServerErrorException(res.error.message);
    return res.data;
  }
}
