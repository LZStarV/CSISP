import { IsEmail, Length } from 'class-validator';

export class SendLoginOtpDto {
  @IsEmail()
  @Length(5, 256)
  email!: string;
}
