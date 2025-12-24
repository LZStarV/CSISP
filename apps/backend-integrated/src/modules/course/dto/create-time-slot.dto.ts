import { IsEnum, IsNumber, IsString } from 'class-validator';
import { Status, WeekDay } from '@csisp/types';

export class CreateTimeSlotDto {
  @IsNumber()
  subCourseId!: number;

  @IsEnum(WeekDay)
  weekday!: WeekDay;

  @IsString()
  startTime!: string;

  @IsString()
  endTime!: string;

  @IsString()
  location!: string;

  @IsEnum(Status)
  status!: Status;
}
