import { randomUUID } from 'crypto';

import {
  set as redisSet,
  get as redisGet,
  del as redisDel,
} from '../infra/redis';

/**
 * 票据标识符类型
 */
export enum TicketIdType {
  UUID = 'uuid',
  Random = 'random',
}

export interface TicketOptions {
  prefix: string; // Redis 前缀 (例如 'idp:reset:')
  ttl: number; // 有效期 (秒)
  idType?: TicketIdType; // ID 生成类型，默认为 Random
}

/**
 * 通用的临时凭据/票据发放助手
 * 适用于 OIDC Ticket, Auth Request, Password Reset Token, OTP 等场景
 */
export class TicketIssuer<T = string> {
  constructor(private readonly opts: TicketOptions) {}

  /**
   * 生成唯一标识符
   */
  private genId(): string {
    if (this.opts.idType === TicketIdType.UUID) {
      return randomUUID();
    }
    return (
      Math.random().toString(36).slice(2) + Date.now().toString(36)
    ).slice(0, 32);
  }

  /**
   * 发放票据：存入 Redis 并返回生成的 ID
   * @param data 存储的数据
   * @param customId 如果提供，则使用此 ID 而不是自动生成（注意：prefix 仍会被附加在 Redis Key 中）
   */
  async issue(data: T, customId?: string): Promise<string> {
    const id = customId ?? this.genId();
    const key = `${this.opts.prefix}${id}`;
    const val = typeof data === 'string' ? data : JSON.stringify(data);
    await redisSet(key, val, this.opts.ttl);
    return id;
  }

  /**
   * 校验票据并获取数据
   */
  async verify(id: string): Promise<T | null> {
    const key = `${this.opts.prefix}${id}`;
    const raw = await redisGet(key);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  }

  /**
   * 消费票据：校验并立即删除
   */
  async consume(id: string): Promise<T | null> {
    const data = await this.verify(id);
    if (data !== null) {
      await redisDel(`${this.opts.prefix}${id}`);
    }
    return data;
  }
}
