import { Global, Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Global()
@Module({
  providers: [SupabaseService, SupabaseAuthGuard, AdminGuard],
  exports: [SupabaseService, SupabaseAuthGuard, AdminGuard],
})
export class SupabaseModule {}
