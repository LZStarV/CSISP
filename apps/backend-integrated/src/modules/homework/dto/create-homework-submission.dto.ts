import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateHomeworkSubmissionDto {
  @IsNumber()
  homeworkId!: number;

  @IsNumber()
  userId!: number;

  @IsString()
  filePath!: string;

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsString()
  content?: string;
}
