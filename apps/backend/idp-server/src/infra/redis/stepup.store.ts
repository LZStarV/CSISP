import type { RedisKV } from '@csisp/redis-sdk';
import { STEPUP_PREFIX } from '@idp-types/redis';

export type StepUpState = 'PENDING_PASSWORD' | 'PENDING_EMAIL_OTP' | 'VERIFIED';

export interface StepUpRecord {
  email: string | null;
  state: StepUpState;
  exp: number;
}

const DEFAULT_TTL = 600;

export class StepUpStore {
  private readonly prefix: string;
  constructor(
    private readonly kv: RedisKV,
    prefix: string = STEPUP_PREFIX
  ) {
    this.prefix = prefix;
  }

  private k(sid: string): string {
    return `${this.prefix}${sid}`;
  }

  private nowSec(): number {
    return Math.floor(Date.now() / 1000);
  }

  async setPendingPassword(
    sid: string,
    email: string,
    ttl: number = DEFAULT_TTL
  ): Promise<void> {
    const rec: StepUpRecord = {
      email,
      state: 'PENDING_PASSWORD',
      exp: this.nowSec() + ttl,
    };
    await this.kv.set(this.k(sid), rec as any, ttl);
  }

  async setPendingEmailOtp(
    sid: string,
    ttl: number = DEFAULT_TTL
  ): Promise<void> {
    const cur = await this.getState(sid);
    const rec: StepUpRecord = {
      email: cur?.email ?? null,
      state: 'PENDING_EMAIL_OTP',
      exp: this.nowSec() + ttl,
    };
    await this.kv.set(this.k(sid), rec as any, ttl);
  }

  async setVerified(sid: string, ttl: number = DEFAULT_TTL): Promise<void> {
    const cur = await this.getState(sid);
    const rec: StepUpRecord = {
      email: cur?.email ?? null,
      state: 'VERIFIED',
      exp: this.nowSec() + ttl,
    };
    await this.kv.set(this.k(sid), rec as any, ttl);
  }

  async getState(sid: string): Promise<StepUpRecord | null> {
    return await this.kv.get<StepUpRecord>(this.k(sid));
  }

  async clear(sid: string): Promise<void> {
    await this.kv.del(this.k(sid));
  }
}
