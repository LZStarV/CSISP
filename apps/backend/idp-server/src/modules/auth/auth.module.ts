import {
  SupabaseUserRepository,
  SupabaseMfaSettingsRepository,
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
  ],
  exports: [AuthServices.SessionService],
})
export class AuthModule {}
