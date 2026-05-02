import type { Oauth2RevokeRequestParams } from '@csisp-api/idp-server';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export class Oauth2RevokeDto implements Oauth2RevokeRequestParams {
  @IsString()
  token!: string;

  @IsOptional()
  @IsString()
  @IsEnum(['access_token', 'refresh_token'])
  tokenTypeHint: string | undefined;
}
