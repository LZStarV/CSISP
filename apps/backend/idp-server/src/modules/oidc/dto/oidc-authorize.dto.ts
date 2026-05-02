import {
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';

export class OidcAuthorizeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  client_id!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1024)
  redirect_uri!: string;

  @IsString()
  @IsEnum(['code'])
  response_type!: string;

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
  nonce?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  code_challenge?: string;

  @IsOptional()
  @IsString()
  @IsEnum(['S256'])
  code_challenge_method?: string;
}
