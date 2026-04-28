import { GetPostFeedRequest } from '@csisp-api/integrated-server';
import { IsInt, IsOptional, Min } from 'class-validator';

export class GetPostFeedDto implements GetPostFeedRequest {
  @IsInt()
  @Min(1)
  @IsOptional()
  page!: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  pageSize!: number;
}
