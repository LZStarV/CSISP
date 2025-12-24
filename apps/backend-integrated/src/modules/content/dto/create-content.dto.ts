import {
  IsArray,
  IsDefined,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class AttachmentDto {
  @IsString()
  name!: string;

  @IsString()
  path!: string;

  @IsOptional()
  @IsNumber()
  size?: number;

  @IsOptional()
  @IsString()
  type?: string;
}

class ScopeDto {
  @IsOptional()
  @IsNumber()
  courseId?: number;

  @IsOptional()
  @IsNumber()
  classId?: number;
}

export class CreateContentDto {
  @IsEnum(['announcement', 'homework'])
  type!: 'announcement' | 'homework';

  @IsString()
  title!: string;

  @IsString()
  richBody!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments: AttachmentDto[] = [];

  @IsDefined()
  @IsNumber()
  authorId!: number;

  @ValidateNested()
  @Type(() => ScopeDto)
  @IsOptional()
  scope?: ScopeDto;

  @IsOptional()
  @IsString()
  status?: string;
}
