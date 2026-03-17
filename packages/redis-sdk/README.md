# @csisp/redis-sdk

Upstash Redis 适配层，提供统一的 KV 能力（set/get/del/exists/ttl）与命名空间前缀管理。既可在非 Nest 场景直接使用核心适配器，也可在 Nest 服务端通过 DI 接入。

## 能力概述

- 核心适配器：`RedisAdapter`（CJS 输出）
  - 方法：`set(key, value, ttlSeconds?)`、`get<T>(key)`、`del(key)`、`exists(key)`、`ttl(key)`
  - 命名空间：构造时传入 `namespace`，统一为所有键加前缀（`{namespace}:{key}`）
  - 实现位置：[src/index.ts](file:///Users/bytedance/project/CSISP/packages/redis-sdk/src/index.ts)
- Nest 集成：`RedisModule.forRoot(...)` + `REDIS_KV` Token（CJS 输出）
  - 子入口路径：`@csisp/redis-sdk/nest`
  - 实现位置：[src/nest/index.ts](file:///Users/bytedance/project/CSISP/packages/redis-sdk/src/nest/index.ts)

## 环境变量

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- 推荐按服务划分命名空间（如 `idp`、`bff` 等），通过应用侧配置传入 `namespace`
- 请通过 Infisical 注入上述变量，避免硬编码

<br />

## 在 Nest 服务端使用（DI）

1. AppModule 接入

```ts
import { RedisModule } from '@csisp/redis-sdk/nest';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    RedisModule.forRoot({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      namespace: 'idp',
    }),
  ],
})
export class AppModule {}
```

1. 在业务类中注入使用

```ts
import { Inject, Injectable } from '@nestjs/common';
import type { RedisKV } from '@csisp/redis-sdk';
import { REDIS_KV } from '@csisp/redis-sdk/nest';

@Injectable()
export class SmsService {
  constructor(@Inject(REDIS_KV) private readonly kv: RedisKV) {}

  async sendOtp(phone: string) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    await this.kv.set(`idp:otp:${phone}`, code, 5 * 60);
    return { ok: true };
  }

  async verifyOtp(phone: string, code: string) {
    const expected = await this.kv.get<string>(`idp:otp:${phone}`);
    return !!expected && expected === code;
  }
}
```

1. 在服务中组合复用（示例）

```ts
import { Inject, Injectable } from '@nestjs/common';
import type { RedisKV } from '@csisp/redis-sdk';
import { REDIS_KV } from '@csisp/redis-sdk/nest';

@Injectable()
export class SessionIssuer {
  constructor(@Inject(REDIS_KV) private readonly kv: RedisKV) {}

  async issue(uid: number, ttl: number) {
    const sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    await this.kv.set(`idp:sess:${sid}`, String(uid), ttl);
    return sid;
  }

  async get(sid: string) {
    return this.kv.get<string>(`idp:sess:${sid}`);
  }
}
```

## 在非 Nest 服务端使用（单例）

```ts
import { RedisAdapter } from '@csisp/redis-sdk';

const redis = new RedisAdapter({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  namespace: 'bff',
});

async function example() {
  await redis.set('otp:13800000000', '123456', 300);
  const v = await redis.get<string>('otp:13800000000');
}
```

## 键命名与 TTL 约定

- 推荐统一前缀枚举（示例）
  - `idp:sess:{sid}` 会话
  - `idp:otp:{phone}` 短信验证码
  - `oidc:ticket:{uuid}` 授权态
  - `oidc:code:{code}` 授权码
- TTL 通过 `set(key, value, { ex: seconds })` 管理；本适配层统一以 `ttlSeconds` 直接传秒值
- 存储 JSON 时请进行显式序列化/反序列化（示例：`JSON.stringify(data)` 与 `JSON.parse(raw)`）

## 与 Supabase Edge Functions 的关系

- 业务内读写 Redis 使用本适配层即可；无需通过 Edge Functions
- 对外入口或就近限流/Webhook 等可通过 Edge Functions 实现（本仓库已提供 upstash-health 示例）
- 统一调用 Supabase 项目级 `functions/v1/{name}` 端点，并通过 Service Role Key 或 Anon Key 鉴权调用

## 包导出结构

- 核心入口：`@csisp/redis-sdk`
- Nest 子入口：`@csisp/redis-sdk/nest`
  - `RedisModule.forRoot(options)`
  - `REDIS_KV` 注入 Token

## 安全与最佳实践

- 通过 Infisical 管理 Upstash URL/Token；不要在代码中硬编码密钥
- 按服务划分命名空间，避免键空间冲突
- 在高并发或关键路径下，结合调用方的重试策略与错误日志，提升可观测性
