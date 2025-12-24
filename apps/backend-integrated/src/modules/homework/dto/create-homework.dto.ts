import { IsEnum, IsNumber, IsString } from 'class-validator';
import { Status } from '@csisp/types';

export class CreateHomeworkDto {
  @IsNumber()
  classId!: number;

  @IsString()
  title!: string;

  @IsString()
  content!: string;

  @IsString()
  deadline!: string;

  @IsEnum(Status)
  status!: Status;
}
