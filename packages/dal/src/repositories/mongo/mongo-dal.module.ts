import { TypegooseModule } from '@m8a/nestjs-typegoose';
import { Module } from '@nestjs/common';

// eslint-disable-next-line no-restricted-imports
import { Post, Reply, Announcement } from '../../types';

import { MongoAnnouncementRepository } from './announcement.repository';
import { MongoPostRepository } from './post.repository';
import { MongoReplyRepository } from './reply.repository';

@Module({
  imports: [TypegooseModule.forFeature([Post, Reply, Announcement])],
  providers: [
    MongoPostRepository,
    MongoReplyRepository,
    MongoAnnouncementRepository,
  ],
  exports: [
    MongoPostRepository,
    MongoReplyRepository,
    MongoAnnouncementRepository,
  ],
})
export class MongoDalModule {}
