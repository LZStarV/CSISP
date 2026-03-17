import { RedisAdapter } from '@csisp/redis-sdk';

import { config as appConfig } from '../config';

export const redis = new RedisAdapter({
  url: appConfig.redis.upstash.url,
  token: appConfig.redis.upstash.token,
  namespace: appConfig.redis.namespace,
});
