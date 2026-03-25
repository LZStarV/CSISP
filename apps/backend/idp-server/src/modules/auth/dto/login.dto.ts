import { Length, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @Length(1, 128)
  studentId!: string;

  @IsString()
  @Length(1, 512)
  password!: string;
}
