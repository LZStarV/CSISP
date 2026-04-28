import { MongoDalModule } from '@csisp/dal';
import { Module } from '@nestjs/common';

import { ForumGrpcController } from './forum.grpc.controller';
import { PostService, ReplyService } from './service';

@Module({
  imports: [MongoDalModule],
  controllers: [ForumGrpcController],
  providers: [PostService, ReplyService],
  exports: [PostService, ReplyService],
})
export class ForumModule {}
