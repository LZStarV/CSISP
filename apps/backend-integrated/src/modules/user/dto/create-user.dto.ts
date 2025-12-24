import { IsEnum, IsNumber, IsOptional, IsString, Length } from 'class-validator';
import { Status } from '@csisp/types';

export class CreateUserDto {
  @IsString()
  @Length(3, 32)
  username!: string;

  @IsString()
  @Length(6, 128)
  password!: string;

  @IsString()
  realName!: string;

  @IsString()
  studentId!: string;

  @IsNumber()
  enrollmentYear!: number;

  @IsString()
  major!: string;

  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
