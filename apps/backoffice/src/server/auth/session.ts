import { SessionManager, MemorySessionStore } from '@csisp/auth/server';

import { getRedis } from '@/src/infra/redis';

// 适配 Redis 存储到 SessionStore 接口
const redisStore = {
  get: async (key: string) => {
    const r = getRedis();
    if (!r) return null;
    const raw = await r.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw).user;
    } catch {
      return null;
    }
  },
  set: async (key: string, value: any, ttlMs: number) => {
    const r = getRedis();
    if (r) {
      await r.set(key, JSON.stringify({ user: value }), 'PX', ttlMs);
    }
  },
  del: async (key: string) => {
    const r = getRedis();
    if (r) {
      await r.del(key);
    }
  },
};

const store = getRedis() ? redisStore : new MemorySessionStore();
export const sessionManager = new SessionManager(store);

export async function createSession(token: string, user: any, ttlMs?: number) {
  return sessionManager.create(token, user, ttlMs as number);
}

export async function getSession(token: string): Promise<any | null> {
  return sessionManager.get(token);
}

export async function destroySession(token: string) {
  return sessionManager.destroy(token);
}
