import { getBffLogger } from '@common/logger';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
  PORTAL_ANNOUNCE_ACTION,
  PORTAL_ANNOUNCE_PATH_PREFIX,
  PORTAL_PATH_PREFIX,
  getAnnouncementListBodySchema,
  createAnnouncementBodySchema,
  type GetAnnouncementListParams,
  type GetAnnouncementListResult,
  type CreateAnnouncementParams,
  type CreateAnnouncementResult,
} from '@csisp/contracts';
import {
  ANNOUNCE_SERVICE_NAME,
  GetAnnouncementListRequest,
  GetAnnouncementListResponse as GrpcGetAnnouncementListResponse,
  CreateAnnouncementRequest,
  CreateAnnouncementResponse as GrpcCreateAnnouncementResponse,
} from '@csisp-api/bff-integrated-server';
import { INTEGRATED_CLIENT } from '@infra/grpc-client.module';
import { Body, Controller, Inject, Post as NestPost } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

const PORTAL_ANNOUNCE_CONTROLLER_PREFIX = `${PORTAL_PATH_PREFIX}${PORTAL_ANNOUNCE_PATH_PREFIX}`;

@Controller(PORTAL_ANNOUNCE_CONTROLLER_PREFIX)
export class PortalAnnounceController {
  private readonly logger = getBffLogger('portal-announce');
  private announceService: any;

  constructor(
    @Inject(INTEGRATED_CLIENT)
    private readonly grpcClient: ClientGrpc
  ) {
    this.announceService = this.grpcClient.getService(ANNOUNCE_SERVICE_NAME);
  }

  @NestPost(PORTAL_ANNOUNCE_ACTION.GET_ANNOUNCEMENT_LIST)
  async getAnnouncementList(
    @Body(new ZodValidationPipe(getAnnouncementListBodySchema))
    params: GetAnnouncementListParams
  ): Promise<GetAnnouncementListResult> {
    this.logger.info(
      { action: 'get-announcement-list' },
      'Portal announce request'
    );

    const request: GetAnnouncementListRequest = {
      page: params.page,
      pageSize: params.pageSize,
    };

    const result: GrpcGetAnnouncementListResponse = await firstValueFrom(
      this.announceService.getAnnouncementList(request)
    );

    return {
      code: result.code,
      message: result.message,
      announcements: result.announcements.map(announcement => ({
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        authorId: announcement.authorId,
        authorName: announcement.authorName,
        postType: announcement.postType,
        isPublished: announcement.isPublished,
        createdAt: new Date(
          Number(announcement.createdAt?.seconds) * 1000
        ).toISOString(),
        updatedAt: new Date(
          Number(announcement.updatedAt?.seconds) * 1000
        ).toISOString(),
      })),
      total: Number(result.total),
      page: result.page,
      pageSize: result.pageSize,
    };
  }

  @NestPost(PORTAL_ANNOUNCE_ACTION.CREATE_ANNOUNCEMENT)
  async createAnnouncement(
    @Body(new ZodValidationPipe(createAnnouncementBodySchema))
    params: CreateAnnouncementParams
  ): Promise<CreateAnnouncementResult> {
    this.logger.info(
      { action: 'create-announcement' },
      'Portal announce request'
    );

    // TODO: 从用户上下文获取实际用户信息
    const authorId = 'user-1';
    const authorName = '测试用户';

    const request: CreateAnnouncementRequest = {
      title: params.title,
      content: params.content,
      authorId,
      authorName,
      postType: 'default',
    };

    const result: GrpcCreateAnnouncementResponse = await firstValueFrom(
      this.announceService.createAnnouncement(request)
    );

    return {
      code: result.code,
      message: result.message,
      announcement: result.announcement
        ? {
            id: result.announcement.id,
            title: result.announcement.title,
            content: result.announcement.content,
            authorId: result.announcement.authorId,
            authorName: result.announcement.authorName,
            postType: result.announcement.postType,
            isPublished: result.announcement.isPublished,
            createdAt: new Date(
              Number(result.announcement.createdAt?.seconds) * 1000
            ).toISOString(),
            updatedAt: new Date(
              Number(result.announcement.updatedAt?.seconds) * 1000
            ).toISOString(),
          }
        : undefined,
    };
  }
}
