import { IsEnum } from 'class-validator';
import { Status } from '@csisp/types';

export class UpdateAttendanceTaskStatusDto {
  @IsEnum(Status)
  status!: Status;
}
