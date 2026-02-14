import { requireEnv } from '@csisp/utils';
import { createClient, RedisClientType } from 'redis';

type RedisOptions = {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  namespace?: string;
};

let client: RedisClientType | undefined;
let ns = '';

function buildUrl(opts: RedisOptions): string {
  const host = opts.host ?? requireEnv('REDIS_HOST');
  const portRaw = String(opts.port ?? requireEnv('REDIS_PORT'));
  const port = Number(portRaw);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid environment variable: REDIS_PORT=${portRaw}`);
  }
  const dbRaw = String(opts.db ?? requireEnv('REDIS_DB'));
  const db = Number(dbRaw);
  if (!Number.isInteger(db) || db < 0) {
    throw new Error(`Invalid environment variable: REDIS_DB=${dbRaw}`);
  }
  return `redis://${host}:${port}/${db}`;
}

export async function connect(
  options: RedisOptions = {}
): Promise<RedisClientType> {
  if (client) return client;
  ns = options.namespace ?? requireEnv('REDIS_NAMESPACE');
  const url = buildUrl(options);
  const passwordRaw = options.password ?? process.env.REDIS_PASSWORD;
  const password = passwordRaw === '' ? undefined : passwordRaw;
  client = createClient({ url, password });
  client.on('error', () => {});
  await client.connect();
  return client;
}

export function getClient(): RedisClientType {
  if (!client) throw new Error('Redis client not connected');
  return client;
}

function k(key: string): string {
  return `${ns}:${key}`;
}

export async function set(
  key: string,
  value: string,
  ttlSeconds?: number
): Promise<void> {
  const c = getClient();
  if (ttlSeconds && ttlSeconds > 0) {
    await c.set(k(key), value, { EX: ttlSeconds });
    return;
  }
  await c.set(k(key), value);
}

export async function get(key: string): Promise<string | null> {
  const c = getClient();
  return c.get(k(key));
}

export async function del(key: string): Promise<number> {
  const c = getClient();
  return c.del(k(key));
}

export async function exists(key: string): Promise<number> {
  const c = getClient();
  return c.exists(k(key));
}

export async function ttl(key: string): Promise<number> {
  const c = getClient();
  return c.ttl(k(key));
}

export async function publish(
  channel: string,
  message: string
): Promise<number> {
  const c = getClient();
  return c.publish(`${ns}:${channel}`, message);
}

export function subscribe(
  channel: string,
  onMessage: (message: string) => void
): () => Promise<void> {
  const c = getClient();
  const sub = c.duplicate();
  const ch = `${ns}:${channel}`;
  let closed = false;
  const start = async () => {
    await sub.connect();
    await sub.subscribe(ch, onMessage);
  };
  void start();
  return async () => {
    if (closed) return;
    closed = true;
    try {
      await sub.unsubscribe(ch);
    } finally {
      await sub.quit();
    }
  };
}

export async function healthCheck(): Promise<boolean> {
  const c = getClient();
  const pong = await c.ping();
  return pong === 'PONG';
}
