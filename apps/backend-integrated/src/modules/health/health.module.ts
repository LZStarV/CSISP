import { Module } from '@nestjs/common';

import { RpcExceptionFilter } from '../../common/rpc/rpc-exception.filter';

import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  controllers: [HealthController],
  providers: [HealthService, RpcExceptionFilter],
})
export class HealthModule {}
