import { IsEmail, Length } from 'class-validator';

export class ResendSignupOtpDto {
  @IsEmail()
  @Length(5, 256)
  email!: string;
}
