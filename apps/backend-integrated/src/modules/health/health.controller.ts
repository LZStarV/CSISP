import { Controller, Get, Inject } from '@nestjs/common';
import type { Sequelize } from 'sequelize';
import { POSTGRES_SEQUELIZE } from '@infra/postgres/postgres.providers';

/**
 * 健康检查控制器
 *
 * 提供 /api/health 端点，用于 BFF 和监控系统探活，
 * 是 backend-integrated 最小可运行版本的一部分。
 */
@Controller('health')
export class HealthController {
  constructor(@Inject(POSTGRES_SEQUELIZE) private readonly sequelize: Sequelize) {}

  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'backend-integrated',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('db/health')
  async getDbHealth() {
    try {
      await this.sequelize.authenticate();
      return { code: 200, message: '数据库连接正常' };
    } catch (error) {
      return { code: 503, message: '数据库连接失败' };
    }
  }
}
