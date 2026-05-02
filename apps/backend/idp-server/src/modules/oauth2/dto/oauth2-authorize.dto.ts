import type { Oauth2AuthorizeRequestParams } from '@csisp-api/idp-server';
import {
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';

export class Oauth2AuthorizeDto implements Oauth2AuthorizeRequestParams {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  clientId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1024)
  redirectUri!: string;

  @IsString()
  @IsEnum(['code'])
  responseType!: 'code';

  @IsString()
  @MinLength(1)
  @MaxLength(256)
  scope!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(256)
  state!: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  nonce: string | undefined;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  codeChallenge: string | undefined;

  @IsOptional()
  @IsString()
  @IsEnum(['S256'])
  codeChallengeMethod: 'S256' | undefined;
}
