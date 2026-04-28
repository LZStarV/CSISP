import { GetPostDetailRequest } from '@csisp-api/integrated-server';
import { IsString } from 'class-validator';

export class GetPostDetailDto implements GetPostDetailRequest {
  @IsString()
  postId!: string;
}
