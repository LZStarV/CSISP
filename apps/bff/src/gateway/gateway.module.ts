import { ProxyService } from '@common/proxy/proxy.service';
import { Module } from '@nestjs/common';

import { ProxyController } from './proxy.controller';

@Module({
  controllers: [ProxyController],
  providers: [ProxyService],
})
export class GatewayModule {}
