import { IsEnum, IsNumber, IsString } from 'class-validator';
import { Status } from '@csisp/types';

export class CreateSubCourseDto {
  @IsNumber()
  courseId!: number;

  @IsString()
  subCourseCode!: string;

  @IsNumber()
  teacherId!: number;

  @IsNumber()
  academicYear!: number;

  @IsEnum(Status)
  status!: Status;
}
