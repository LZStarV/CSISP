import { getBffLogger } from '@common/logger';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
  PORTAL_FORUM_ACTION,
  PORTAL_FORUM_PATH_PREFIX,
  PORTAL_PATH_PREFIX,
  createPostBodySchema,
  getPostFeedBodySchema,
  getPostDetailBodySchema,
  createReplyBodySchema,
  type CreatePostParams,
  type CreatePostResult,
  type GetPostFeedParams,
  type GetPostFeedResult,
  type GetPostDetailParams,
  type GetPostDetailResult,
  type CreateReplyParams,
  type CreateReplyResult,
} from '@csisp/contracts';
import {
  FORUM_SERVICE_NAME,
  CreatePostRequest,
  CreatePostResponse as GrpcCreatePostResponse,
  GetPostFeedRequest,
  GetPostFeedResponse as GrpcGetPostFeedResponse,
  GetPostDetailRequest,
  GetPostDetailResponse as GrpcGetPostDetailResponse,
  CreateReplyRequest,
  CreateReplyResponse as GrpcCreateReplyResponse,
} from '@csisp-api/bff-integrated-server';
import { INTEGRATED_CLIENT } from '@infra/grpc-client.module';
import { Body, Controller, Inject, Post as NestPost } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

const PORTAL_FORUM_CONTROLLER_PREFIX = `${PORTAL_PATH_PREFIX}${PORTAL_FORUM_PATH_PREFIX}`;

@Controller(PORTAL_FORUM_CONTROLLER_PREFIX)
export class PortalForumController {
  private readonly logger = getBffLogger('portal-forum');
  private forumService: any;

  constructor(
    @Inject(INTEGRATED_CLIENT)
    private readonly grpcClient: ClientGrpc
  ) {
    this.forumService = this.grpcClient.getService(FORUM_SERVICE_NAME);
  }

  @NestPost(PORTAL_FORUM_ACTION.CREATE_POST)
  async createPost(
    @Body(new ZodValidationPipe(createPostBodySchema))
    params: CreatePostParams
  ): Promise<CreatePostResult> {
    this.logger.info({ action: 'create-post' }, 'Portal forum request');

    // TODO: 从用户上下文获取实际用户信息
    const authorId = 'user-1';
    const authorName = '测试用户';

    const request: CreatePostRequest = {
      title: params.title,
      content: params.content,
      authorId,
      authorName,
      postType: 'default',
    };

    const result: GrpcCreatePostResponse = await firstValueFrom(
      this.forumService.createPost(request)
    );

    return {
      code: result.code,
      message: result.message,
      post: result.post
        ? {
            id: result.post.id,
            title: result.post.title,
            content: result.post.content,
            authorId: result.post.authorId,
            authorName: result.post.authorName,
            postType: result.post.postType,
            createdAt: new Date(
              Number(result.post.createdAt?.seconds) * 1000
            ).toISOString(),
            updatedAt: new Date(
              Number(result.post.updatedAt?.seconds) * 1000
            ).toISOString(),
          }
        : undefined,
    };
  }

  @NestPost(PORTAL_FORUM_ACTION.GET_POST_FEED)
  async getPostFeed(
    @Body(new ZodValidationPipe(getPostFeedBodySchema))
    params: GetPostFeedParams
  ): Promise<GetPostFeedResult> {
    this.logger.info({ action: 'get-post-feed' }, 'Portal forum request');

    const request: GetPostFeedRequest = {
      page: params.page,
      pageSize: params.pageSize,
    };

    const result: GrpcGetPostFeedResponse = await firstValueFrom(
      this.forumService.getPostFeed(request)
    );

    return {
      code: result.code,
      message: result.message,
      posts: result.posts.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        authorId: post.authorId,
        authorName: post.authorName,
        postType: post.postType,
        createdAt: new Date(
          Number(post.createdAt?.seconds) * 1000
        ).toISOString(),
        updatedAt: new Date(
          Number(post.updatedAt?.seconds) * 1000
        ).toISOString(),
      })),
      total: Number(result.total),
      page: result.page,
      pageSize: result.pageSize,
    };
  }

  @NestPost(PORTAL_FORUM_ACTION.GET_POST_DETAIL)
  async getPostDetail(
    @Body(new ZodValidationPipe(getPostDetailBodySchema))
    params: GetPostDetailParams
  ): Promise<GetPostDetailResult> {
    this.logger.info({ action: 'get-post-detail' }, 'Portal forum request');

    const request: GetPostDetailRequest = {
      postId: params.postId,
    };

    const result: GrpcGetPostDetailResponse = await firstValueFrom(
      this.forumService.getPostDetail(request)
    );

    return {
      code: result.code,
      message: result.message,
      post: result.post
        ? {
            id: result.post.id,
            title: result.post.title,
            content: result.post.content,
            authorId: result.post.authorId,
            authorName: result.post.authorName,
            postType: result.post.postType,
            createdAt: new Date(
              Number(result.post.createdAt?.seconds) * 1000
            ).toISOString(),
            updatedAt: new Date(
              Number(result.post.updatedAt?.seconds) * 1000
            ).toISOString(),
          }
        : undefined,
      replies: result.replies.map(reply => ({
        id: reply.id,
        postId: reply.postId,
        content: reply.content,
        authorId: reply.authorId,
        authorName: reply.authorName,
        createdAt: new Date(
          Number(reply.createdAt?.seconds) * 1000
        ).toISOString(),
      })),
    };
  }

  @NestPost(PORTAL_FORUM_ACTION.CREATE_REPLY)
  async createReply(
    @Body(new ZodValidationPipe(createReplyBodySchema))
    params: CreateReplyParams
  ): Promise<CreateReplyResult> {
    this.logger.info({ action: 'create-reply' }, 'Portal forum request');

    // TODO: 从用户上下文获取实际用户信息
    const authorId = 'user-1';
    const authorName = '测试用户';

    const request: CreateReplyRequest = {
      postId: params.postId,
      content: params.content,
      authorId,
      authorName,
    };

    const result: GrpcCreateReplyResponse = await firstValueFrom(
      this.forumService.createReply(request)
    );

    return {
      code: result.code,
      message: result.message,
      reply: result.reply
        ? {
            id: result.reply.id,
            postId: result.reply.postId,
            content: result.reply.content,
            authorId: result.reply.authorId,
            authorName: result.reply.authorName,
            createdAt: new Date(
              Number(result.reply.createdAt?.seconds) * 1000
            ).toISOString(),
          }
        : undefined,
    };
  }
}
