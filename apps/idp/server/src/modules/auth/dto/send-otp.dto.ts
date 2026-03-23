import { IsEmail, Length } from 'class-validator';

export class SendOtpDto {
  @IsEmail()
  @Length(5, 256)
  email!: string;
}
