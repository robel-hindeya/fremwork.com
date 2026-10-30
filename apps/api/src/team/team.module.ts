import { BadRequestException, Body, Controller, Get, Injectable, Module, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SkipThrottle } from '@nestjs/throttler';
import { IsEmail } from 'class-validator';
import { SupabaseService } from '../supabase/supabase.service';
import { AdminOnly, CurrentUser, type AuthUser } from '../auth/types';

class InviteTeamDto {
  @IsEmail({}, { message: 'Enter a valid email address.' }) email: string;
}

const nameFromEmail = (em: string) => em.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

@Injectable()
export class TeamService {
  constructor(private readonly supabase: SupabaseService, private readonly config: ConfigService) {}

  /** Owners and admins, then invites that have not been accepted yet. */
  async list() {
    const db = this.supabase.db;
    const admins = SupabaseService.check(
      await db.from('profiles').select('email, full_name, role, created_at').in('role', ['owner', 'admin']).order('created_at'),
    ) as { email: string; full_name: string | null; role: string }[];
    const invites = SupabaseService.check(
      await db.from('team_invites').select('email').is('accepted_at', null).order('created_at'),
    ) as { email: string }[];
    const have = new Set(admins.map((a) => a.email.toLowerCase()));
    const owners = admins.sort((a, b) => (a.role === 'owner' ? -1 : b.role === 'owner' ? 1 : 0));
    return [
      ...owners.map((a) => ({ name: a.full_name || nameFromEmail(a.email), email: a.email, role: a.role })),
      ...invites.filter((i) => !have.has(i.email.toLowerCase())).map((i) => ({ name: nameFromEmail(i.email), email: i.email, role: 'invited' })),
    ];
  }

  async invite(email: string, by: AuthUser) {
    const db = this.supabase.db;
    const em = email.trim();
    const like = em.replace(/[\\%_]/g, (c) => '\\' + c); // exact, case-insensitive match
    if (em.toLowerCase() === by.email.toLowerCase()) throw new BadRequestException('You are already on the team.');

    // Remember the invite so the sign-up trigger grants the admin role.
    const { data: prior } = await db.from('team_invites').select('id').ilike('email', like).maybeSingle();
    if (!prior) SupabaseService.check(await db.from('team_invites').insert({ email: em, role: 'admin', invited_by: by.id }));

    // Already has an account: promote right away.
    const { data: existing } = await db.from('profiles').select('id, role').ilike('email', like).maybeSingle();
    if (existing) {
      if (existing.role === 'member') await db.from('profiles').update({ role: 'admin' }).eq('id', existing.id);
      return { name: nameFromEmail(em), email: em, role: existing.role === 'owner' ? 'owner' : 'admin' };
    }

    const web = (this.config.get<string>('WEB_URL') ?? 'http://localhost:3000').split(',')[0].trim().replace(/\/+$/, '');
    const { error } = await db.auth.admin.inviteUserByEmail(em, { redirectTo: `${web}/set-password` });
    if (error) throw new BadRequestException(error.message);
    return { name: nameFromEmail(em), email: em, role: 'invited' };
  }
}

@SkipThrottle()
@Controller('admin/team')
export class TeamController {
  constructor(private readonly team: TeamService) {}

  @Get()
  @AdminOnly()
  list() {
    return this.team.list();
  }

  @Post('invite')
  @AdminOnly()
  invite(@Body() dto: InviteTeamDto, @CurrentUser() user: AuthUser) {
    return this.team.invite(dto.email, user);
  }
}

@Module({ controllers: [TeamController], providers: [TeamService] })
export class TeamModule {}
