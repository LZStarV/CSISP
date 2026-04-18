import {
  DemoController as DemoControllerInterface,
  DemoControllerMethods,
  GetDemoInfoResponse,
} from '@csisp-api/integrated-server';
import { Controller } from '@nestjs/common';

import { DemoService } from './demo.service';
import { GetDemoInfoRequest } from './dto/get-demo-info.dto';

@Controller()
@DemoControllerMethods()
export class DemoController implements DemoControllerInterface {
  constructor(private readonly demoService: DemoService) {}

  async getDemoInfo(request: GetDemoInfoRequest): Promise<GetDemoInfoResponse> {
    return this.demoService.getDemoInfo(request);
  }
}
