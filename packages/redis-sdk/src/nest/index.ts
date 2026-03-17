import { DynamicModule, Global, Module } from '@nestjs/common';

import type { RedisKV } from '../index';
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
    class MemoryKV implements RedisKV {
      private m = new Map<string, { v: string; exp?: number }>();
      private k(key: string) {
        return `${opts.namespace}:${key}`;
      }
      private now() {
        return Date.now();
      }
      async set(
        key: string,
        value: string,
        ttlSeconds?: number
      ): Promise<void> {
        const exp =
          ttlSeconds && ttlSeconds > 0
            ? this.now() + ttlSeconds * 1000
            : undefined;
        this.m.set(this.k(key), { v: value, exp });
      }
      async get<T = string>(key: string): Promise<T | null> {
        const r = this.m.get(this.k(key));
        if (!r) return null;
        if (r.exp && this.now() > r.exp) {
          this.m.delete(this.k(key));
          return null;
        }
        return r.v as unknown as T;
      }
      async del(key: string): Promise<number> {
        return this.m.delete(this.k(key)) ? 1 : 0;
      }
      async exists(key: string): Promise<number> {
        const r = await this.get(key);
        return r !== null ? 1 : 0;
      }
      async ttl(key: string): Promise<number> {
        const r = this.m.get(this.k(key));
        if (!r) return -2;
        if (!r.exp) return -1;
        const remain = Math.floor((r.exp - this.now()) / 1000);
        return remain > 0 ? remain : -2;
      }
      async incr(key: string): Promise<number> {
        const cur = await this.get<string>(key);
        const n = (cur ? parseInt(cur, 10) : 0) + 1;
        await this.set(key, String(n));
        return n;
      }
      async expire(key: string, seconds: number): Promise<number> {
        const r = this.m.get(this.k(key));
        if (!r) return 0;
        r.exp = this.now() + seconds * 1000;
        this.m.set(this.k(key), r);
        return 1;
      }
    }
    const provider = {
      provide: REDIS_KV,
      useFactory: () => {
        const hasConfig = !!opts.url && !!opts.token;
        return hasConfig ? new RedisAdapter(opts) : new MemoryKV();
      },
    };
    return {
      global: true,
      module: RedisModule,
      providers: [provider],
      exports: [provider],
    };
  }
}
