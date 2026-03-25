import { Length, IsString } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @Length(1, 128)
  studentId!: string;

  @IsString()
  @Length(8, 64)
  newPassword!: string;

  @IsString()
  @Length(1, 128)
  resetToken!: string;
}
