import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

/**
 * 健康检查模块
 *
 * 仅注册 HealthController，用于对外提供健康检查接口，
 * 不依赖数据库和其他基础设施模块。
 */
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
