import { DEFAULT_SESSION_TTL } from '../common/constants';

export interface SessionStore {
  get(key: string): Promise<any | null>;
  set(key: string, value: any, ttlMs: number): Promise<void>;
  del(key: string): Promise<void>;
}

/**
 * 内存存储实现，作为兜底或开发使用
 */
export class MemorySessionStore implements SessionStore {
  private readonly sessions = new Map<
    string,
    { user: any; expiresAt: number }
  >();

  // 从存储中获取会话数据
  async get(key: string): Promise<any | null> {
    const s = this.sessions.get(key);
    if (!s) return null;
    if (Date.now() > s.expiresAt) {
      this.sessions.delete(key);
      return null;
    }
    return s.user;
  }

  // 设置会话数据，自动添加前缀
  async set(key: string, value: any, ttlMs: number): Promise<void> {
    this.sessions.set(key, { user: value, expiresAt: Date.now() + ttlMs });
  }

  // 删除会话数据，自动添加前缀
  async del(key: string): Promise<void> {
    this.sessions.delete(key);
  }
}

export class SessionManager {
  constructor(
    private readonly store: SessionStore,
    private readonly prefix: string = 'sess:'
  ) {}

  async create(
    token: string,
    user: any,
    ttlMs: number = DEFAULT_SESSION_TTL
  ): Promise<void> {
    await this.store.set(this.prefix + token, user, ttlMs);
  }

  async get(token: string): Promise<any | null> {
    return this.store.get(this.prefix + token);
  }

  async destroy(token: string): Promise<void> {
    await this.store.del(this.prefix + token);
  }
}
