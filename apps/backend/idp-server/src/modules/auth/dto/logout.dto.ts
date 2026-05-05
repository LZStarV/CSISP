import { LogoutRequest as GeneratedLogoutRequest } from '@csisp-api/idp-server';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AuthLogoutDto implements GeneratedLogoutRequest {
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  post_logout_redirect_uri?: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  state?: string;
}
