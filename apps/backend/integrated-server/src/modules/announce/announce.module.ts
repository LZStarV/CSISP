import { MongoDalModule } from '@csisp/dal';
import { Module } from '@nestjs/common';

import { AnnounceGrpcController } from './announce.grpc.controller';
import { AnnouncementService } from './service';

@Module({
  imports: [MongoDalModule],
  controllers: [AnnounceGrpcController],
  providers: [AnnouncementService],
  exports: [AnnouncementService],
})
export class AnnounceModule {}
