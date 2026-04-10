import { VerifyOtpDto as GeneratedVerifyOtpDto } from '@csisp-api/idp-server';
import { IsString, Length } from 'class-validator';

export class VerifyOtpDto implements GeneratedVerifyOtpDto {
  @IsString()
  @Length(4, 16)
  token!: string;
}
