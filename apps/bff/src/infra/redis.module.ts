import { config } from '@config';
import { RedisAdapter } from '@csisp/redis-sdk';
import { Global, Module } from '@nestjs/common';

export const BFF_REDIS = 'BFF_REDIS';

@Global()
@Module({
  providers: [
    {
      provide: BFF_REDIS,
      useFactory: () =>
        new RedisAdapter({
          url: config.redis.upstash.url,
          token: config.redis.upstash.token,
          namespace: config.redis.namespace,
        }),
    },
  ],
  exports: [BFF_REDIS],
})
export class RedisInfraModule {}
