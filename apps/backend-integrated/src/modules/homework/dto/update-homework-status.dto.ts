import { IsEnum } from 'class-validator';
import { Status } from '@csisp/types';

export class UpdateHomeworkStatusDto {
  @IsEnum(Status)
  status!: Status;
}
