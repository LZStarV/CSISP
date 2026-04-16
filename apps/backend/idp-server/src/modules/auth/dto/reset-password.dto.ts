import {
  ResetPasswordDto as GeneratedResetPasswordDto,
  ResetReason,
} from '@csisp-api/idp-server';
import { Length, IsString, IsOptional } from 'class-validator';

export class ResetPasswordDto implements GeneratedResetPasswordDto {
  @IsString()
  @Length(1, 128)
  studentId!: string;

  @IsString()
  @Length(8, 64)
  newPassword!: string;

  @IsString()
  @Length(1, 128)
  resetToken!: string;

  @IsOptional()
  @IsString()
  reason?: ResetReason;
}
