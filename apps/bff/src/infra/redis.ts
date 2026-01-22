import { createClient, type RedisClientType } from 'redis';

type RedisOptions = {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  namespace?: string;
};

let client: RedisClientType | undefined;
let ns = 'csisp';

// 组装 redis:// 连接 URL
function buildUrl(opts: RedisOptions): string {
  const host = opts.host ?? process.env.REDIS_HOST ?? 'localhost';
  const port = Number(opts.port ?? process.env.REDIS_PORT ?? 6379);
  const db = Number(opts.db ?? process.env.REDIS_DB ?? 0);
  return `redis://${host}:${port}/${db}`;
}

// 幂等连接：首次创建并连接，后续复用同一实例
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

// 获取已连接的客户端；未连接时抛错
export function getClient(): RedisClientType {
  if (!client) throw new Error('Redis client not connected');
  return client;
}

// 命名空间键构造
function k(key: string): string {
  return `${ns}:${key}`;
}

// 写入键（可选 TTL，单位秒）
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

// 读取字符串键
export async function get(key: string): Promise<string | null> {
  const c = getClient();
  return c.get(k(key));
}

// 删除键（返回删除数量）
export async function del(key: string): Promise<number> {
  const c = getClient();
  return c.del(k(key));
}

// 判断键是否存在（1 存在，0 不存在）
export async function exists(key: string): Promise<number> {
  const c = getClient();
  return c.exists(k(key));
}

// 查询剩余 TTL（秒）；无 TTL 返回 -1，不存在返回 -2
export async function ttl(key: string): Promise<number> {
  const c = getClient();
  return c.ttl(k(key));
}

// 发布消息到命名空间下的频道
export async function publish(
  channel: string,
  message: string
): Promise<number> {
  const c = getClient();
  return c.publish(`${ns}:${channel}`, message);
}

// 订阅频道并注册回调；返回取消订阅函数（包含解绑与 quit）
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

// 健康检查：PING == PONG 视为可用
export async function healthCheck(): Promise<boolean> {
  const c = getClient();
  const pong = await c.ping();
  return pong === 'PONG';
}
