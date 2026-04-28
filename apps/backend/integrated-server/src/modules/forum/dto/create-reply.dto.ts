import { CreateReplyRequest } from '@csisp-api/integrated-server';
import { IsString } from 'class-validator';

export class CreateReplyDto implements CreateReplyRequest {
  @IsString()
  postId!: string;

  @IsString()
  content!: string;

  @IsString()
  authorId!: string;

  @IsString()
  authorName!: string;
}
