import { Controller, Get, Injectable, Module } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { SupabaseService } from '../supabase/supabase.service';
import { AdminOnly } from '../auth/types';

/* eslint-disable @typescript-eslint/no-explicit-any */
const toVisitor = (r: any) => ({
  id: r.id, email: r.email, ip: r.ip, userAgent: r.user_agent, referrer: r.referrer, firstPath: r.first_path, lastPath: r.last_path,
  visits: r.visits, firstSeen: r.first_seen, lastSeen: r.last_seen,
  country: r.country, region: r.region, city: r.city, source: r.source,
});

/** Unique website visitors. Rows are written by the public.track_visit DB function, called from the browser. */
@Injectable()
export class VisitorsService {
  constructor(private readonly supabase: SupabaseService) {}

  async list() {
    const rows = SupabaseService.check(
      await this.supabase.db.from('site_visitors').select('*').eq('is_team', false).order('last_seen', { ascending: false }).limit(2000),
    ) as any[];
    return rows.map(toVisitor);
  }
}

@Controller('admin/visitors')
export class VisitorsController {
  constructor(private readonly visitors: VisitorsService) {}

  @SkipThrottle()
  @Get()
  @AdminOnly()
  list() {
    return this.visitors.list();
  }
}

@Module({ controllers: [VisitorsController], providers: [VisitorsService] })
export class VisitorsModule {}
