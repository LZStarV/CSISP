import { createClient, RedisClientType } from 'redis';

type RedisOptions = {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  namespace?: string;
};

let client: RedisClientType | undefined;
let ns = 'csisp';

// 构建 Redis URL
function buildUrl(opts: RedisOptions): string {
  const host = opts.host ?? process.env.REDIS_HOST ?? 'localhost';
  const port = Number(opts.port ?? process.env.REDIS_PORT ?? 6379);
  const db = Number(opts.db ?? process.env.REDIS_DB ?? 0);
  return `redis://${host}:${port}/${db}`;
}

// 连接 Redis 服务器
export async function connect(
  options: RedisOptions = {}
): Promise<RedisClientType> {
  if (client) return client;
  ns = options.namespace ?? process.env.REDIS_NAMESPACE ?? 'csisp';
  const url = buildUrl(options);
  const password = options.password ?? process.env.REDIS_PASSWORD;
  client = createClient({ url, password });
  client.on('error', () => {});
  await client.connect();
  return client;
}

// 获取 Redis 客户端实例
export function getClient(): RedisClientType {
  if (!client) throw new Error('Redis client not connected');
  return client;
}

function k(key: string): string {
  return `${ns}:${key}`;
}

// 设置键值对
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

// 获取键值对
export async function get(key: string): Promise<string | null> {
  const c = getClient();
  return c.get(k(key));
}

// 删除键值对
export async function del(key: string): Promise<number> {
  const c = getClient();
  return c.del(k(key));
}

// 检查键是否存在
export async function exists(key: string): Promise<number> {
  const c = getClient();
  return c.exists(k(key));
}

// 获取键的过期时间（TTL）
export async function ttl(key: string): Promise<number> {
  const c = getClient();
  return c.ttl(k(key));
}

// 发布消息到频道
export async function publish(
  channel: string,
  message: string
): Promise<number> {
  const c = getClient();
  return c.publish(`${ns}:${channel}`, message);
}

// 订阅频道并处理消息
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

// 检查 Redis 连接是否正常
export async function healthCheck(): Promise<boolean> {
  const c = getClient();
  const pong = await c.ping();
  return pong === 'PONG';
}
