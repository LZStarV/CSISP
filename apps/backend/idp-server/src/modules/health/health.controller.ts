import { ApiIdpController } from '@common/decorators/controller.decorator';
import { SupabaseUserRepository } from '@csisp/dal';
import type { RedisKV } from '@csisp/redis-sdk';
import { REDIS_KV } from '@csisp/redis-sdk/nest';
import { Get, Inject, Injectable } from '@nestjs/common';

@ApiIdpController('health')
@Injectable()
export class HealthController {
  constructor(
    private readonly userRepository: SupabaseUserRepository,
    @Inject(REDIS_KV) private readonly kv: RedisKV
  ) {}

  @Get()
  async check() {
    const checks: {
      status: 'ok' | 'error';
      timestamp: string;
      checks: {
        database: { status: 'ok' | 'error'; message?: string };
        redis: { status: 'ok' | 'error'; message?: string };
      };
    } = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      checks: {
        database: { status: 'ok' },
        redis: { status: 'ok' },
      },
    };

    // 检查数据库连接
    try {
      await this.userRepository.findById(1);
      checks.checks.database.status = 'ok';
      checks.checks.database.message = 'Database connection successful';
    } catch (error) {
      checks.checks.database.status = 'error';
      checks.checks.database.message =
        error instanceof Error ? error.message : 'Unknown database error';
      checks.status = 'error';
    }

    // 检查 Redis 连接
    try {
      await this.kv.exists('health:ping');
      checks.checks.redis.status = 'ok';
      checks.checks.redis.message = 'Redis connection successful';
    } catch (error) {
      checks.checks.redis.status = 'error';
      checks.checks.redis.message =
        error instanceof Error ? error.message : 'Unknown redis error';
      checks.status = 'error';
    }

    return checks;
  }
}
