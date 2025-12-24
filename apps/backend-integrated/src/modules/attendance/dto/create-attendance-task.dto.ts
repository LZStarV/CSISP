import { IsEnum, IsNumber, IsString } from 'class-validator';
import { Status } from '@csisp/types';

export class CreateAttendanceTaskDto {
  @IsNumber()
  classId!: number;

  @IsString()
  taskName!: string;

  @IsString()
  taskType!: string;

  @IsString()
  startTime!: string;

  @IsString()
  endTime!: string;

  @IsEnum(Status)
  status!: Status;
}
