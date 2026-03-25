import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @Length(5, 256)
  email!: string;

  @IsString()
  @Length(1, 512)
  password!: string;

  // 10–12 位数字学号
  @Matches(/^\d{10,12}$/)
  student_id!: string;

  @IsOptional()
  @IsString()
  @Length(1, 128)
  display_name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 512)
  redirect_uri?: string;
}
