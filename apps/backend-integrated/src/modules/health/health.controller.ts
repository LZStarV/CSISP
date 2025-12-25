import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';

/**
 * 健康检查控制器
 *
 * 提供 /api/health 端点，用于 BFF 和监控系统探活，
 * 是 backend-integrated 最小可运行版本的一部分。
 */
@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly mongoConn: Connection) {}

  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'backend-integrated',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('db/mongo')
  async getMongoHealth() {
    try {
      const start = Date.now();
      await this.mongoConn.db?.command({ ping: 1 });
      const latency = Date.now() - start;
      const readyState = this.mongoConn.readyState;
      return { code: 200, message: 'Mongo 连接正常', latency, readyState };
    } catch (e) {
      return { code: 503, message: 'Mongo 连接失败' };
    }
  }
}
