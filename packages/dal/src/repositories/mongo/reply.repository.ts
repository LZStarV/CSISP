import { InjectModel } from '@m8a/nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';

// eslint-disable-next-line no-restricted-imports
import {
  Reply,
  type ReplyDocument,
  type ReplyInsert,
  type ReplyUpdate,
} from '../../types';

import { BaseMongoRepository } from './base.mongo.repository';

export class MongoReplyRepository extends BaseMongoRepository<
  Reply,
  ReplyDocument,
  ReplyInsert,
  ReplyUpdate
> {
  constructor(
    @InjectModel(Reply)
    model: ReturnModelType<typeof Reply>
  ) {
    super(model);
  }

  /**
   * 根据帖子 ID 获取回复列表
   */
  async findByPostId(postId: string): Promise<ReplyDocument[]> {
    return this.model.find({ postId }).sort({ createdAt: 1 }).exec();
  }
}
