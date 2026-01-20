import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { RpcExceptionFilter } from '../../common/rpc/rpc-exception.filter';

@Module({
  controllers: [HealthController],
  providers: [HealthService, RpcExceptionFilter],
})
export class HealthModule {}
