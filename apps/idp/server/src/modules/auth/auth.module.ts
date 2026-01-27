import { Module } from '@nestjs/common';

import { SequelizePostgresModule } from '../../infra/postgres/sequelize.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [SequelizePostgresModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
