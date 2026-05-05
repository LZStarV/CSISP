import { SupabaseDataAccess } from '@csisp/supabase-sdk';
import { Global, Module } from '@nestjs/common';

import { SupabaseMfaSettingsRepository } from './mfa-settings.repository';
import { SupabaseUserRepository } from './user.repository';

@Global()
@Module({
  providers: [
    {
      provide: SupabaseUserRepository,
      useFactory: (sda: SupabaseDataAccess) => new SupabaseUserRepository(sda),
      inject: [SupabaseDataAccess],
    },
    {
      provide: SupabaseMfaSettingsRepository,
      useFactory: (sda: SupabaseDataAccess) =>
        new SupabaseMfaSettingsRepository(sda),
      inject: [SupabaseDataAccess],
    },
  ],
  exports: [SupabaseUserRepository, SupabaseMfaSettingsRepository],
})
export class SupabaseDalModule {}
