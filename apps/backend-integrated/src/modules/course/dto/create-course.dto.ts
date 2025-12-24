import { IsEnum, IsNumber, IsString } from 'class-validator';
import { Semester, Status } from '@csisp/types';

export class CreateCourseDto {
  @IsString()
  courseName!: string;

  @IsString()
  courseCode!: string;

  @IsEnum(Semester)
  semester!: Semester;

  @IsNumber()
  academicYear!: number;

  @IsString({ each: true })
  availableMajors!: string[];

  @IsEnum(Status)
  status!: Status;
}
