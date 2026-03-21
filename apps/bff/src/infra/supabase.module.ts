import { config } from '@config';
import { SupabaseModule as CoreSupabaseModule } from '@csisp/supabase-sdk';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    CoreSupabaseModule.register({
      url: config.supabase.url,
      serviceRoleKey: config.supabase.serviceRoleKey,
      anonKey: config.supabase.anonKey,
    }),
  ],
  exports: [CoreSupabaseModule],
})
export class SupabaseInfraModule {}
