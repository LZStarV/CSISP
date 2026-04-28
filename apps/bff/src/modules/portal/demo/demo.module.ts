import { GrpcClientModule } from '@infra/grpc-client.module';
import { Module } from '@nestjs/common';

import { PortalDemoController } from './demo.controller';

@Module({
  imports: [GrpcClientModule],
  controllers: [PortalDemoController],
})
export class PortalDemoModule {}
