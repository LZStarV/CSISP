import { IsEnum, IsNumber, IsOptional, IsString, Length } from 'class-validator';
import { Status } from '@csisp/types';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(3, 32)
  username?: string;

  @IsOptional()
  @IsString()
  realName?: string;

  @IsOptional()
  @IsString()
  studentId?: string;

  @IsOptional()
  @IsNumber()
  enrollmentYear?: number;

  @IsOptional()
  @IsString()
  major?: string;

  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
