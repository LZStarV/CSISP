import { IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @Length(4, 16)
  token!: string;
}
