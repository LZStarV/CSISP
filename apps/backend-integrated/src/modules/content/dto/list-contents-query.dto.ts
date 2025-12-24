import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';

export class ListContentsQueryDto {
  @IsOptional()
  @IsEnum(['announcement', 'homework'])
  type?: 'announcement' | 'homework';

  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsNumber()
  courseId?: number;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsNumber()
  classId?: number;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : 1))
  @IsNumber()
  page?: number;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : 20))
  @IsNumber()
  size?: number;
}
