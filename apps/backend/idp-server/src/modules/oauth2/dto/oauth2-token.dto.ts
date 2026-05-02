import type { Oauth2TokenRequestParams } from '@csisp-api/idp-server';
import { IsString, IsOptional, IsEnum, MinLength } from 'class-validator';

export class Oauth2TokenDto implements Oauth2TokenRequestParams {
  @IsString()
  @IsEnum(['authorization_code', 'refresh_token'])
  grantType!: string;

  @IsString()
  @MinLength(1)
  clientId!: string;

  @IsOptional()
  @IsString()
  code: string | undefined;

  @IsOptional()
  @IsString()
  redirectUri: string | undefined;

  @IsOptional()
  @IsString()
  clientSecret: string | undefined;

  @IsOptional()
  @IsString()
  codeVerifier: string | undefined;

  @IsOptional()
  @IsString()
  refreshToken: string | undefined;
}
