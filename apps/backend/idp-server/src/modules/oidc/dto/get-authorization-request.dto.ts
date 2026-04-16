import { GetAuthorizationRequestParams } from '@csisp-api/idp-server';
import { IsString, Length } from 'class-validator';

export class GetAuthorizationRequestDto implements GetAuthorizationRequestParams {
  @IsString()
  @Length(1, 512)
  ticket!: string;
}
