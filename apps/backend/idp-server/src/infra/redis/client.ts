import { config as appConfig } from '@config';
import { RedisAdapter } from '@csisp/redis-sdk';

export const redis = new RedisAdapter({
  url: appConfig.redis.upstash.url,
  token: appConfig.redis.upstash.token,
  namespace: appConfig.redis.namespace,
});
