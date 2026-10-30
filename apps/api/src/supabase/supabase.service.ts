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
    const url =
      config.get<string>('SUPABASE_URL') ||
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      'https://gwdrtfcqqnvhwolbjkab.supabase.co';
    const key =
      config.get<string>('SUPABASE_SERVICE_ROLE_KEY') ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      'sb_publishable_jzmf0N9Uo3Q2ZYAfAIbWCg_xBzWttHY';
    this.hasServiceKey = !!(config.get<string>('SUPABASE_SERVICE_ROLE_KEY') || process.env.SUPABASE_SERVICE_ROLE_KEY);
    if (!this.hasServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set. The API is using the publishable key, so waitlist, events and admin writes will fail. Set it in the API environment.');
    }
    this.db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  }

  /** Unwraps a Supabase response or throws a 500 with the database message. */
  static check<T>(res: { data: T; error: { message: string } | null }): T {
    if (res.error) throw new InternalServerErrorException(res.error.message);
    return res.data;
  }
}
