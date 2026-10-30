import { Controller, Get, Injectable, Module } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { SupabaseService } from '../supabase/supabase.service';
import { AdminOnly } from '../auth/types';

const WEEK = 7 * 24 * 3600 * 1000;

@Injectable()
export class OverviewService {
  constructor(private readonly supabase: SupabaseService) {}

  /** Sign-ups per week for the last 8 weeks (oldest first) and a merged activity feed. */
  async get() {
    const db = this.supabase.db;
    const since = new Date(Date.now() - 8 * WEEK).toISOString();
    const [signups, latestWl, latestRegs, latestInvites] = await Promise.all([
      db.from('waitlist_entries').select('created_at').gte('created_at', since),
      db.from('waitlist_entries').select('name, company, created_at').order('created_at', { ascending: false }).limit(5),
      db.from('event_registrations').select('name, created_at, events(title)').order('created_at', { ascending: false }).limit(5),
      db.from('waitlist_entries').select('name, invited_at').not('invited_at', 'is', null).order('invited_at', { ascending: false }).limit(5),
    ]);

    const weeks = Array(8).fill(0) as number[];
    for (const r of SupabaseService.check(signups) as { created_at: string }[]) {
      const ago = Math.floor((Date.now() - new Date(r.created_at).getTime()) / WEEK);
      if (ago >= 0 && ago < 8) weeks[7 - ago]++;
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const activity = [
      ...(SupabaseService.check(latestWl) as any[]).map((r) => ({
        kind: 'waitlist', at: r.created_at, text: `${r.name} joined the waitlist${r.company ? ` from ${r.company}` : ''}.`,
      })),
      ...(SupabaseService.check(latestRegs) as any[]).map((r) => ({
        kind: 'registration', at: r.created_at, text: `${r.name} registered for ${r.events?.title ?? 'an event'}.`,
      })),
      ...(SupabaseService.check(latestInvites) as any[]).map((r) => ({ kind: 'invite', at: r.invited_at, text: `${r.name} was invited.` })),
    ]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 5);

    return { weeks, activity };
  }
}

@SkipThrottle()
@Controller('admin/overview')
export class OverviewController {
  constructor(private readonly overview: OverviewService) {}

  @Get()
  @AdminOnly()
  get() {
    return this.overview.get();
  }
}

@Module({ controllers: [OverviewController], providers: [OverviewService] })
export class OverviewModule {}
