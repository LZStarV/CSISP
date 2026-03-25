import type { RedisKV } from '@csisp/redis-sdk';

export type ExchangeRecord = {
  sid: string;
  email: string | null;
  app_id: string;
  redirect_uri: string;
  ua?: string;
  ip?: string;
  exp: number;
};

const DEFAULT_TTL = 60;
const DEFAULT_PREFIX = 'xchg:';

export class ExchangeStore {
  private readonly prefix: string;
  constructor(
    private readonly kv: RedisKV,
    prefix: string = DEFAULT_PREFIX
  ) {
    this.prefix = prefix;
  }

  private k(code: string): string {
    return `${this.prefix}${code}`;
  }

  private lockK(code: string): string {
    return `${this.prefix}lock:${code}`;
  }

  private nowSec(): number {
    return Math.floor(Date.now() / 1000);
  }

  async issue(
    code: string,
    data: Omit<ExchangeRecord, 'exp'>,
    ttl: number = DEFAULT_TTL
  ): Promise<void> {
    const rec: ExchangeRecord = { ...data, exp: this.nowSec() + ttl };
    await this.kv.set(this.k(code), JSON.stringify(rec), ttl);
  }

  async peek(code: string): Promise<ExchangeRecord | null> {
    const raw = await this.kv.get<string>(this.k(code));
    if (!raw) return null;
    try {
      const obj = JSON.parse(raw) as ExchangeRecord;
      return obj;
    } catch {
      return null;
    }
  }

  async consume(code: string): Promise<ExchangeRecord | null> {
    const lockKey = this.lockK(code);
    const n = await this.kv.incr(lockKey);
    if (n === 1) {
      await this.kv.expire(lockKey, 5);
      const raw = await this.kv.get<string>(this.k(code));
      if (!raw) return null;
      await this.kv.del(this.k(code));
      try {
        const obj = JSON.parse(raw) as ExchangeRecord;
        return obj;
      } catch {
        return null;
      }
    }
    return null;
  }
}
