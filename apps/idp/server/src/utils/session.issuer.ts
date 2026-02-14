import { RedisPrefix } from '@idp-types/redis';
import { set as redisSet, get as redisGet } from '@infra/redis';
import type { Response } from 'express';

/**
 * Cookie SameSite 策略枚举
 */
export enum SameSite {
  Lax = 'lax', // 严格限制跨站请求（如 POST）
  Strict = 'strict', // 严格限制所有跨站请求
  None = 'none', // 不限制跨站请求（需 HTTPS）
}

/**
 * 会话发放模式枚举
 */
export enum SessionMode {
  Short = 'short',
  Long = 'long',
}

export interface SessionOptions {
  ttlShort: number; // 短期会话 TTL (秒)
  ttlLong: number; // 长期会话 TTL (秒)
  redisPrefix: string; // Redis 键名前缀
  cookie: {
    name: string;
    httpOnly: boolean;
    sameSite: SameSite;
    secure: boolean;
    domain?: string;
    path?: string;
  };
}

export class SessionIssuer {
  constructor(private readonly opts: SessionOptions) {}

  /**
   * 生成随机 sid
   */
  private genSid(): string {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  /**
   * 统一发放会话：写入 Redis 并设置 Cookie
   * @param res Express Response 对象
   * @param uid 用户 ID
   * @param mode 会话模式 (Short 或 Long)
   * @returns 生成的 sid
   */
  async issue(
    res: Response,
    uid: number | string,
    mode: SessionMode
  ): Promise<string> {
    const sid = this.genSid();
    const ttl =
      mode === SessionMode.Short ? this.opts.ttlShort : this.opts.ttlLong;

    // 1. 写入 Redis
    await redisSet(`${this.opts.redisPrefix}${sid}`, String(uid), ttl);

    // 2. 设置 Cookie
    res.cookie(this.opts.cookie.name, sid, {
      ...this.opts.cookie,
      maxAge: ttl * 1000, // 将秒转换为毫秒用于 Cookie maxAge
    });

    return sid;
  }

  /**
   * 获取会话中的用户 ID
   * @param sid 会话 ID
   */
  async get(sid: string): Promise<string | null> {
    const key = `${this.opts.redisPrefix}${sid}`;
    return redisGet(key);
  }
}

/**
 * 默认会话配置
 */
export const defaultSessionOptions: SessionOptions = {
  ttlShort: 300,
  ttlLong: 3600,
  redisPrefix: RedisPrefix.IdpSession,
  cookie: {
    name: 'idp_session',
    httpOnly: true,
    sameSite: SameSite.Lax,
    secure: process.env.NODE_ENV === 'production',
    domain: process.env.IDP_COOKIE_DOMAIN || undefined,
    path: '/',
  },
};
