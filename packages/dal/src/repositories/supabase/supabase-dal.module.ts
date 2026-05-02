import { SupabaseDataAccess } from '@csisp/supabase-sdk';
import { Global, Module } from '@nestjs/common';

import { SupabaseMfaSettingsRepository } from './mfa-settings.repository';
import { SupabaseOidcClientRepository } from './oidc-client.repository';
import { SupabaseOidcKeyRepository } from './oidc-key.repository';
import { SupabaseRefreshTokenRepository } from './refresh-token.repository';
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
    {
      provide: SupabaseOidcKeyRepository,
      useFactory: (sda: SupabaseDataAccess) =>
        new SupabaseOidcKeyRepository(sda),
      inject: [SupabaseDataAccess],
    },
    {
      provide: SupabaseRefreshTokenRepository,
      useFactory: (sda: SupabaseDataAccess) =>
        new SupabaseRefreshTokenRepository(sda),
      inject: [SupabaseDataAccess],
    },
  ],
  exports: [
    SupabaseUserRepository,
    SupabaseMfaSettingsRepository,
    SupabaseOidcClientRepository,
    SupabaseOidcKeyRepository,
    SupabaseRefreshTokenRepository,
  ],
})
export class SupabaseDalModule {}
