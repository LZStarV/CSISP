import { getRedis } from '@/src/infra/redis';

const memorySessions = new Map<string, { user: any; expiresAt: number }>();
const DEFAULT_TTL_MS = 2 * 60 * 60 * 1000;

export async function createSession(
  token: string,
  user: any,
  ttlMs = DEFAULT_TTL_MS
) {
  const r = getRedis();
  if (r) {
    await r.set(`sess:${token}`, JSON.stringify({ user }), 'PX', ttlMs);
  } else {
    memorySessions.set(token, { user, expiresAt: Date.now() + ttlMs });
  }
}

export async function getSession(token: string): Promise<any | null> {
  const r = getRedis();
  if (r) {
    const raw = await r.get(`sess:${token}`);
    if (!raw) return null;
    try {
      const obj = JSON.parse(raw);
      return obj?.user ?? null;
    } catch {
      return null;
    }
  } else {
    const s = memorySessions.get(token);
    if (!s) return null;
    if (Date.now() > s.expiresAt) {
      memorySessions.delete(token);
      return null;
    }
    return s.user;
  }
}

export async function destroySession(token: string) {
  const r = getRedis();
  if (r) {
    await r.del(`sess:${token}`);
  } else {
    memorySessions.delete(token);
  }
}
