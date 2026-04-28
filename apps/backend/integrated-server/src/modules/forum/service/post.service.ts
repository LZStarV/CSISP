import { MongoPostRepository, type PostDocument } from '@csisp/dal';
import {
  CreatePostRequest,
  CreatePostResponse,
  GetPostFeedRequest,
  GetPostFeedResponse,
  Post,
} from '@csisp-api/integrated-server';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  constructor(private readonly postRepository: MongoPostRepository) {}

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

  async createPost(request: CreatePostRequest): Promise<CreatePostResponse> {
    try {
      const insertData = {
        title: request.title,
        content: request.content,
        authorId: request.authorId,
        authorName: request.authorName,
        postType: request.postType,
      };

      const post = await this.postRepository.create(insertData);
      const postProto = this.toPostProto(post);

      return {
        post: postProto,
        code: 200,
        message: 'Success',
      };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error('Create post failed', err);
      return {
        post: undefined,
        code: 500,
        message: err.message || 'Internal Server Error',
      };
    }
  }

  async getPostFeed(request: GetPostFeedRequest): Promise<GetPostFeedResponse> {
    try {
      const page = request.page || 1;
      const pageSize = request.pageSize || 20;

      const { data, total } = await this.postRepository.findPaginated(
        page,
        pageSize
      );

      const posts: Post[] = data.map((post: PostDocument) =>
        this.toPostProto(post)
      );

      return {
        posts,
        total,
        page,
        pageSize,
        code: 200,
        message: 'Success',
      };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error('Get post feed failed', err);
      return {
        posts: [],
        total: 0,
        page: request.page || 1,
        pageSize: request.pageSize || 20,
        code: 500,
        message: err.message || 'Internal Server Error',
      };
    }
  }
}
