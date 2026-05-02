import { LoginInternalDto as GeneratedLoginInternalDto } from '@csisp-api/idp-server';
import { IsString, Matches, MinLength, MaxLength } from 'class-validator';

export class LoginInternalDto implements GeneratedLoginInternalDto {
  @IsString()
  @Matches(/^\d{10,14}$/, { message: '学号必须是10-14位数字' })
  student_id!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(512)
  password!: string;
}
