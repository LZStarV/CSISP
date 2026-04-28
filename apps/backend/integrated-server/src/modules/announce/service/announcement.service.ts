import {
  MongoAnnouncementRepository,
  type AnnouncementDocument,
} from '@csisp/dal';
import {
  GetAnnouncementListRequest,
  GetAnnouncementListResponse,
  CreateAnnouncementRequest,
  CreateAnnouncementResponse,
  Announcement,
} from '@csisp-api/integrated-server';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AnnouncementService {
  private readonly logger = new Logger(AnnouncementService.name);

  constructor(
    private readonly announcementRepository: MongoAnnouncementRepository
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

  private toAnnouncementProto(
    announcement: AnnouncementDocument & { createdAt?: Date; updatedAt?: Date }
  ): Announcement {
    return {
      id: announcement._id.toString(),
      title: announcement.title,
      content: announcement.content,
      authorId: announcement.authorId,
      authorName: announcement.authorName,
      postType: announcement.postType || 'default',
      isPublished: announcement.isPublished || true,
      createdAt: this.toTimestamp(announcement.createdAt),
      updatedAt: this.toTimestamp(announcement.updatedAt),
    };
  }

  async getAnnouncementList(
    request: GetAnnouncementListRequest
  ): Promise<GetAnnouncementListResponse> {
    try {
      const page = request.page || 1;
      const pageSize = request.pageSize || 20;

      const { data, total } = await this.announcementRepository.findPaginated(
        page,
        pageSize
      );

      const announcements: Announcement[] = data.map(
        (announcement: AnnouncementDocument) =>
          this.toAnnouncementProto(announcement)
      );

      return {
        announcements,
        total,
        page,
        pageSize,
        code: 200,
        message: 'Success',
      };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error('Get announcement list failed', err);
      return {
        announcements: [],
        total: 0,
        page: request.page || 1,
        pageSize: request.pageSize || 20,
        code: 500,
        message: err.message || 'Internal Server Error',
      };
    }
  }

  async createAnnouncement(
    request: CreateAnnouncementRequest
  ): Promise<CreateAnnouncementResponse> {
    try {
      const insertData = {
        title: request.title,
        content: request.content,
        authorId: request.authorId,
        authorName: request.authorName,
        postType: request.postType,
        isPublished: true,
      };

      const announcement = await this.announcementRepository.create(insertData);
      const announcementProto = this.toAnnouncementProto(announcement);

      return {
        announcement: announcementProto,
        code: 200,
        message: 'Success',
      };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error('Create announcement failed', err);
      return {
        announcement: undefined,
        code: 500,
        message: err.message || 'Internal Server Error',
      };
    }
  }
}
