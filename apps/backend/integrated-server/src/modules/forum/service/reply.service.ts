import {
  MongoPostRepository,
  MongoReplyRepository,
  type PostDocument,
  type ReplyDocument,
} from '@csisp/dal';
import {
  GetPostDetailRequest,
  GetPostDetailResponse,
  CreateReplyRequest,
  CreateReplyResponse,
  Post,
  Reply,
} from '@csisp-api/integrated-server';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ReplyService {
  private readonly logger = new Logger(ReplyService.name);

  constructor(
    private readonly postRepository: MongoPostRepository,
    private readonly replyRepository: MongoReplyRepository
  ) {}

  private toTimestamp(date: Date | undefined): {
    seconds: number;
    nanos: number;
  } {
    if (!date) {
      return { seconds: 0, nanos: 0 };
    }
    const ms = date.getTime();
    return {
      seconds: Math.floor(ms / 1000),
      nanos: (ms % 1000) * 1000000,
    };
  }

  private toPostProto(
    post: PostDocument & { createdAt?: Date; updatedAt?: Date }
  ): Post {
    return {
      id: post._id.toString(),
      title: post.title,
      content: post.content,
      authorId: post.authorId,
      authorName: post.authorName,
      postType: post.postType || 'default',
      createdAt: this.toTimestamp(post.createdAt),
      updatedAt: this.toTimestamp(post.updatedAt),
    };
  }

  private toReplyProto(reply: ReplyDocument & { createdAt?: Date }): Reply {
    return {
      id: reply._id.toString(),
      postId: reply.postId,
      content: reply.content,
      authorId: reply.authorId,
      authorName: reply.authorName,
      createdAt: this.toTimestamp(reply.createdAt),
    };
  }

  async getPostDetail(
    request: GetPostDetailRequest
  ): Promise<GetPostDetailResponse> {
    try {
      const post = await this.postRepository.findById(request.postId);
      if (!post) {
        return {
          post: undefined,
          replies: [],
          code: 404,
          message: 'Post not found',
        };
      }

      const replies = await this.replyRepository.findByPostId(request.postId);
      const postProto = this.toPostProto(post);
      const repliesProto: Reply[] = replies.map((reply: ReplyDocument) =>
        this.toReplyProto(reply)
      );

      return {
        post: postProto,
        replies: repliesProto,
        code: 200,
        message: 'Success',
      };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error('Get post detail failed', err);
      return {
        post: undefined,
        replies: [],
        code: 500,
        message: err.message || 'Internal Server Error',
      };
    }
  }

  async createReply(request: CreateReplyRequest): Promise<CreateReplyResponse> {
    try {
      const insertData = {
        postId: request.postId,
        content: request.content,
        authorId: request.authorId,
        authorName: request.authorName,
      };

      const reply = await this.replyRepository.create(insertData);
      const replyProto = this.toReplyProto(reply);

      return {
        reply: replyProto,
        code: 200,
        message: 'Success',
      };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error('Create reply failed', err);
      return {
        reply: undefined,
        code: 500,
        message: err.message || 'Internal Server Error',
      };
    }
  }
}
