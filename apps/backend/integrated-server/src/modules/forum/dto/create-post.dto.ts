import { CreatePostRequest } from '@csisp-api/integrated-server';
import { IsString, IsOptional } from 'class-validator';

export class CreatePostDto implements CreatePostRequest {
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
