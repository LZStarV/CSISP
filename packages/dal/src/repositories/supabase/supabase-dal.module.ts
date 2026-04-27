import { SupabaseDataAccess, SUPABASE_SERVICE } from '@csisp/supabase-sdk';
import { Module } from '@nestjs/common';

import { SupabaseMfaSettingsRepository } from './mfa-settings.repository';
import { SupabaseOidcClientRepository } from './oidc-client.repository';
import { SupabaseUserRepository } from './user.repository';

@Module({
  providers: [
    {
      provide: SupabaseUserRepository,
      useFactory: (sda: SupabaseDataAccess) => new SupabaseUserRepository(sda),
      inject: [SUPABASE_SERVICE],
    },
    {
      provide: SupabaseMfaSettingsRepository,
      useFactory: (sda: SupabaseDataAccess) =>
        new SupabaseMfaSettingsRepository(sda),
      inject: [SUPABASE_SERVICE],
    },
    {
      provide: SupabaseOidcClientRepository,
      useFactory: (sda: SupabaseDataAccess) =>
        new SupabaseOidcClientRepository(sda),
      inject: [SUPABASE_SERVICE],
    },
  ],
  exports: [
    SupabaseUserRepository,
    SupabaseMfaSettingsRepository,
    SupabaseOidcClientRepository,
  ],
})
export class SupabaseDalModule {}
