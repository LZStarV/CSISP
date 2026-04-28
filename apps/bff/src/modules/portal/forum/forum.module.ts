import { GrpcClientModule } from '@infra/grpc-client.module';
import { Module } from '@nestjs/common';

import { PortalForumController } from './forum.controller';

@Module({
  imports: [GrpcClientModule],
  controllers: [PortalForumController],
})
export class PortalForumModule {}
