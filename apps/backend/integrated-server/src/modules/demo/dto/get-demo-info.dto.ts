import { GetDemoInfoRequest as GeneratedGetDemoInfoRequest } from '@csisp-api/integrated-server';
import { IsString, IsBoolean } from 'class-validator';

export class GetDemoInfoRequest implements GeneratedGetDemoInfoRequest {
  @IsString()
  demoId!: string;

  @IsBoolean()
  withExtra!: boolean;
}
