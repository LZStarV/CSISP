import { ResendSignupOtpDto as GeneratedResendSignupOtpDto } from '@csisp-api/idp-server';
import { IsEmail, Length } from 'class-validator';

export class ResendSignupOtpDto implements GeneratedResendSignupOtpDto {
  @IsEmail()
  @Length(5, 256)
  email!: string;
}
