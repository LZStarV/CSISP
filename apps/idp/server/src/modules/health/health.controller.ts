import { Controller, Get } from '@nestjs/common';

import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly service: HealthService) {}

  @Get()
  /**
   * 健康检查接口
   * - 返回服务可用状态与服务器当前时间戳
   */
  status() {
    return this.service.getStatus();
  }
}
