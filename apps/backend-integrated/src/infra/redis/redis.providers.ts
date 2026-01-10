import type { Provider } from '@nestjs/common';
import { getClient } from './index';

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const redisProviders: Provider[] = [
  {
    provide: REDIS_CLIENT,
    useFactory: () => {
      return getClient();
    },
  },
];
