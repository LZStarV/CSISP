import {
  ForumController as ForumControllerInterface,
  ForumControllerMethods,
  CreatePostResponse,
  GetPostFeedResponse,
  GetPostDetailResponse,
  CreateReplyResponse,
} from '@csisp-api/integrated-server';
import { Controller } from '@nestjs/common';

import { CreatePostDto } from './dto/create-post.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { GetPostDetailDto } from './dto/get-post-detail.dto';
import { GetPostFeedDto } from './dto/get-post-feed.dto';
import { PostService, ReplyService } from './service';

@Controller()
@ForumControllerMethods()
export class ForumGrpcController implements ForumControllerInterface {
  private readonly logger = console;

  constructor(
    private readonly postService: PostService,
    private readonly replyService: ReplyService
  ) {}

  async createPost(request: CreatePostDto): Promise<CreatePostResponse> {
    this.logger.log('CreatePost called', request);
    return this.postService.createPost(request);
  }

  async getPostFeed(request: GetPostFeedDto): Promise<GetPostFeedResponse> {
    this.logger.log('GetPostFeed called', request);
    return this.postService.getPostFeed(request);
  }

  async getPostDetail(
    request: GetPostDetailDto
  ): Promise<GetPostDetailResponse> {
    this.logger.log('GetPostDetail called', request);
    return this.replyService.getPostDetail(request);
  }

  async createReply(request: CreateReplyDto): Promise<CreateReplyResponse> {
    this.logger.log('CreateReply called', request);
    return this.replyService.createReply(request);
  }
}
