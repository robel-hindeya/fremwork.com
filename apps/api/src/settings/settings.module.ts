import { Body, Controller, Get, Injectable, Module, Put } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { IsBoolean, IsEmail, IsObject, IsOptional, ValidateIf } from 'class-validator';
import { SupabaseService } from '../supabase/supabase.service';
import { AdminOnly } from '../auth/types';

export interface Settings {
  acceptSignups: boolean;
  welcomeEmail: boolean;
  askCompany: boolean;
  alertInstant: boolean;
  alertDigest: boolean;
  notifyEmail: string;
  requiredFields: Record<string, boolean>;
}

const REQUIRED_KEYS = ['name', 'email', 'company', 'role', 'size', 'heard'];

class UpdateSettingsDto {
  @IsOptional() @IsBoolean() acceptSignups?: boolean;
  @IsOptional() @IsBoolean() welcomeEmail?: boolean;
  @IsOptional() @IsBoolean() askCompany?: boolean;
  @IsOptional() @IsBoolean() alertInstant?: boolean;
  @IsOptional() @IsBoolean() alertDigest?: boolean;
  @IsOptional() @ValidateIf((o) => o.notifyEmail !== '') @IsEmail({}, { message: 'Enter a valid alert email.' }) notifyEmail?: string;
  @IsOptional() @IsObject() requiredFields?: Record<string, boolean>;
}

@Injectable()
export class SettingsService {
  constructor(private readonly supabase: SupabaseService) {}

  async get(): Promise<Settings> {
    const row = SupabaseService.check(await this.supabase.db.from('app_settings').select('*').eq('id', 1).single());
    return {
      acceptSignups: row.accept_signups,
      welcomeEmail: row.welcome_email,
      askCompany: row.ask_company,
      alertInstant: row.alert_instant,
      alertDigest: row.alert_digest,
      notifyEmail: row.notify_email,
      requiredFields: { ...row.required_fields, name: true, email: true },
    };
  }

  async update(dto: UpdateSettingsDto): Promise<Settings> {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.acceptSignups !== undefined) patch.accept_signups = dto.acceptSignups;
    if (dto.welcomeEmail !== undefined) patch.welcome_email = dto.welcomeEmail;
    if (dto.askCompany !== undefined) patch.ask_company = dto.askCompany;
    if (dto.alertInstant !== undefined) patch.alert_instant = dto.alertInstant;
    if (dto.alertDigest !== undefined) patch.alert_digest = dto.alertDigest;
    if (dto.notifyEmail !== undefined) patch.notify_email = dto.notifyEmail;
    if (dto.requiredFields) {
      patch.required_fields = Object.fromEntries(REQUIRED_KEYS.map((k) => [k, k === 'name' || k === 'email' ? true : !!dto.requiredFields![k]]));
    }
    SupabaseService.check(await this.supabase.db.from('app_settings').update(patch).eq('id', 1));
    return this.get();
  }
}

@SkipThrottle()
@Controller()
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  /** What the public forms need to know. */
  @Get('settings/public')
  async publicSettings() {
    const s = await this.settings.get();
    return { acceptSignups: s.acceptSignups, askCompany: s.askCompany, requiredFields: s.requiredFields };
  }

  @Get('admin/settings')
  @AdminOnly()
  get() {
    return this.settings.get();
  }

  @Put('admin/settings')
  @AdminOnly()
  update(@Body() dto: UpdateSettingsDto) {
    return this.settings.update(dto);
  }
}

@Module({ controllers: [SettingsController], providers: [SettingsService], exports: [SettingsService] })
export class SettingsModule {}
