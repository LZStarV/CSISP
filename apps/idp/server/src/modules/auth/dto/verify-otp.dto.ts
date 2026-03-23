import { IsIn, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @Length(1, 512)
  token_hash!: string;

  @IsIn(['email', 'magic_link'])
  type!: 'email' | 'magic_link';
}
