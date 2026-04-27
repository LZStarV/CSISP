import { GotrueService } from '@infra/supabase/gotrue.service';
import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, GotrueService],
})
export class AuthModule {}
