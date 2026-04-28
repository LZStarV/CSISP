import { TypegooseModule } from '@m8a/nestjs-typegoose';
import { Module } from '@nestjs/common';

// eslint-disable-next-line no-restricted-imports
import { Demo, Post, Reply, Announcement } from '../../types';

import { MongoAnnouncementRepository } from './announcement.repository';
import { MongoDemoRepository } from './demo.repository';
import { MongoPostRepository } from './post.repository';
import { MongoReplyRepository } from './reply.repository';

@Module({
  imports: [TypegooseModule.forFeature([Demo, Post, Reply, Announcement])],
  providers: [
    MongoDemoRepository,
    MongoPostRepository,
    MongoReplyRepository,
    MongoAnnouncementRepository,
  ],
  exports: [
    MongoDemoRepository,
    MongoPostRepository,
    MongoReplyRepository,
    MongoAnnouncementRepository,
  ],
})
export class MongoDalModule {}
