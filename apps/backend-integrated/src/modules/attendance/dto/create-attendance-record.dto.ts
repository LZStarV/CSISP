import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { AttendanceStatus } from '@csisp/types';

export class CreateAttendanceRecordDto {
  @IsNumber()
  attendanceTaskId!: number;

  @IsNumber()
  userId!: number;

  @IsEnum(['normal', 'late', 'absent', 'leave', 'not_checked'] as any)
  status!: AttendanceStatus;

  @IsOptional()
  @IsString()
  remark?: string;
}
