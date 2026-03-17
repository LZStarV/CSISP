import { Redis } from '@upstash/redis';

export interface RedisKV {
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  get<T = string>(key: string): Promise<T | null>;
  del(key: string): Promise<number>;
  exists(key: string): Promise<number>;
  ttl(key: string): Promise<number>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
}

export type RedisAdapterOptions = {
  url: string;
  token: string;
  namespace: string;
};

export class RedisAdapter implements RedisKV {
  private readonly client: Redis;
  private readonly ns: string;

  constructor(opts: RedisAdapterOptions) {
    this.client = new Redis({ url: opts.url, token: opts.token });
    this.ns = opts.namespace;
  }

  private k(key: string): string {
    return `${this.ns}:${key}`;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const k = this.k(key);
    if (ttlSeconds && ttlSeconds > 0) {
      await this.client.set(k, value, { ex: ttlSeconds });
      return;
    }
    await this.client.set(k, value);
  }

  async get<T = string>(key: string): Promise<T | null> {
    const v = await this.client.get<T>(this.k(key));
    return v ?? null;
  }

  async del(key: string): Promise<number> {
    return this.client.del(this.k(key));
  }

  async exists(key: string): Promise<number> {
    return this.client.exists(this.k(key));
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(this.k(key));
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(this.k(key));
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.client.expire(this.k(key), seconds);
  }
}
