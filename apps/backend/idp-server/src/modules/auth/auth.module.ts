import {
  SupabaseUserRepository,
  SupabaseMfaSettingsRepository,
  SupabaseOidcClientRepository,
} from '@csisp/dal';
import { GotrueService } from '@infra/supabase/gotrue.service';
import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller';
import * as AuthServices from './service';

@Module({
  controllers: [AuthController],
  providers: [
    ...Object.values(AuthServices),
    GotrueService,
    SupabaseUserRepository,
    SupabaseMfaSettingsRepository,
    SupabaseOidcClientRepository,
  ],
  exports: [AuthServices.SessionService],
})
export class AuthModule {}
