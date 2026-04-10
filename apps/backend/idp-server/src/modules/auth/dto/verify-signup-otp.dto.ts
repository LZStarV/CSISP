import { VerifySignupOtpDto as GeneratedVerifySignupOtpDto } from '@csisp-api/idp-server';
import { IsEmail, Length, Matches } from 'class-validator';

export class VerifySignupOtpDto implements GeneratedVerifySignupOtpDto {
  @IsEmail()
  @Length(5, 256)
  email!: string;

  // 8 位验证码
  @Matches(/^\d{8}$/)
  token!: string;
}
