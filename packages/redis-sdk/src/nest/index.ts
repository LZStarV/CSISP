import { DynamicModule, Global, Module } from '@nestjs/common';

import { RedisAdapter } from '../index';

export const REDIS_KV = 'REDIS_KV';

export type RedisModuleOptions = {
  url: string;
  token: string;
  namespace: string;
};

@Global()
@Module({})
export class RedisModule {
  static forRoot(opts: RedisModuleOptions): DynamicModule {
    const provider = {
      provide: REDIS_KV,
      useFactory: () => new RedisAdapter(opts),
    };
    return {
      global: true,
      module: RedisModule,
      providers: [provider],
      exports: [provider],
    };
  }
}
