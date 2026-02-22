import { Length, IsOptional, IsString } from 'class-validator';

export class EnterDto {
  @IsOptional()
  @IsString()
  @Length(1, 256)
  state?: string;

  @IsOptional()
  @IsString()
  @Length(1, 128)
  ticket?: string;

  @IsOptional()
  @IsString()
  @Length(0, 16)
  redirectMode?: string;

  @IsOptional()
  @IsString()
  @Length(1, 128)
  studentId?: string;
}
