import { Module } from '@nestjs/common';

import { AuthApiImpl } from './auth-api.impl';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [],
  controllers: [AuthController],
  providers: [AuthService, AuthApiImpl],
})
export class AuthModule {}
