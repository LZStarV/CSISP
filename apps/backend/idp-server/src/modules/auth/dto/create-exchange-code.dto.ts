import { CreateExchangeCodeDto as GeneratedCreateExchangeCodeDto } from '@csisp-api/idp-server';
import { IsOptional, IsString, Length } from 'class-validator';

export class CreateExchangeCodeDto implements GeneratedCreateExchangeCodeDto {
  @IsString()
  @Length(1, 128)
  app_id!: string;

  @IsString()
  @Length(1, 1024)
  redirect_uri!: string;

  @IsOptional()
  @IsString()
  @Length(1, 256)
  state?: string;
}
