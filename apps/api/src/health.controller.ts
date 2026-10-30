import { Controller, Get } from '@nestjs/common';
import { SupabaseService } from './supabase/supabase.service';

@Controller('health')
export class HealthController {
  constructor(private readonly supabase: SupabaseService) {}

  /** ok is false until SUPABASE_SERVICE_ROLE_KEY is set and the database answers. */
  @Get()
  async health() {
    if (!this.supabase.hasServiceKey) {
      return { ok: false, problem: 'SUPABASE_SERVICE_ROLE_KEY is not set on the API' };
    }
    const { error } = await this.supabase.db.from('app_settings').select('id').eq('id', 1).single();
    return error ? { ok: false, problem: `Database: ${error.message}` } : { ok: true };
  }
}
