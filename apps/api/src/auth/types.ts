import { createParamDecorator, ExecutionContext, UseGuards, applyDecorators } from '@nestjs/common';
import type { Request } from 'express';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { AdminGuard } from './admin.guard';

export type AppRole = 'owner' | 'admin' | 'member';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: AppRole;
}

export interface AuthedRequest extends Request {
  user?: AuthUser;
}

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
  return ctx.switchToHttp().getRequest<AuthedRequest>().user;
});

/** Signed in with Supabase. */
export const Authed = () => UseGuards(SupabaseAuthGuard);
/** Signed in and an owner or admin. */
export const AdminOnly = () => applyDecorators(UseGuards(SupabaseAuthGuard, AdminGuard));
