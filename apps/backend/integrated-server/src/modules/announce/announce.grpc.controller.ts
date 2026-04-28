import {
  AnnounceController as AnnounceControllerInterface,
  AnnounceControllerMethods,
  GetAnnouncementListResponse,
  CreateAnnouncementResponse,
} from '@csisp-api/integrated-server';
import { Controller } from '@nestjs/common';

import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { GetAnnouncementListDto } from './dto/get-announcement-list.dto';
import { AnnouncementService } from './service';

@Controller()
@AnnounceControllerMethods()
export class AnnounceGrpcController implements AnnounceControllerInterface {
  private readonly logger = console;

  constructor(private readonly announcementService: AnnouncementService) {}

  async getAnnouncementList(
    request: GetAnnouncementListDto
  ): Promise<GetAnnouncementListResponse> {
    this.logger.log('GetAnnouncementList called', request);
    return this.announcementService.getAnnouncementList(request);
  }

  async createAnnouncement(
    request: CreateAnnouncementDto
  ): Promise<CreateAnnouncementResponse> {
    this.logger.log('CreateAnnouncement called', request);
    return this.announcementService.createAnnouncement(request);
  }
}
