import { Global, Module } from '@nestjs/common';
import { redisProviders } from './redis.providers';

@Global()
@Module({
  providers: [...redisProviders],
  exports: [...redisProviders],
})
export class RedisModule {}
