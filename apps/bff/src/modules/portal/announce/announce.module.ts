import { GrpcClientModule } from '@infra/grpc-client.module';
import { Module } from '@nestjs/common';

import { PortalAnnounceController } from './announce.controller';

@Module({
  imports: [GrpcClientModule],
  controllers: [PortalAnnounceController],
})
export class PortalAnnounceModule {}
