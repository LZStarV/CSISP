import { CreateAnnouncementRequest } from '@csisp-api/integrated-server';
import { IsString, IsOptional } from 'class-validator';

export class CreateAnnouncementDto implements CreateAnnouncementRequest {
  @IsString()
  title!: string;

  @IsString()
  content!: string;

  @IsString()
  authorId!: string;

  @IsString()
  authorName!: string;

  @IsString()
  @IsOptional()
  postType!: string;
}
