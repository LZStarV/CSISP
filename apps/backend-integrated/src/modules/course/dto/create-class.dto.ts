import { IsEnum, IsNumber, IsString } from 'class-validator';
import { Semester, Status } from '@csisp/types';

export class CreateClassDto {
  @IsString()
  className!: string;

  @IsNumber()
  courseId!: number;

  @IsNumber()
  teacherId!: number;

  @IsEnum(Semester)
  semester!: Semester;

  @IsNumber()
  academicYear!: number;

  @IsNumber()
  maxStudents!: number;

  @IsEnum(Status)
  status!: Status;
}
