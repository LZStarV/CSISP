import { SupabaseDataAccess } from '@csisp/supabase-sdk';
import { Global, Module } from '@nestjs/common';

import { SupabaseMfaSettingsRepository } from './mfa-settings.repository';
import { SupabaseOidcClientRepository } from './oidc-client.repository';
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
    {
      provide: SupabaseOidcClientRepository,
      useFactory: (sda: SupabaseDataAccess) =>
        new SupabaseOidcClientRepository(sda),
      inject: [SupabaseDataAccess],
    },
  ],
  exports: [
    SupabaseUserRepository,
    SupabaseMfaSettingsRepository,
    SupabaseOidcClientRepository,
  ],
})
export class SupabaseDalModule {}
