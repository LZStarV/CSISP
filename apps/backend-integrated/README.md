# Backend Integrated

## 项目简介

- 这是后端的主项目。
- 接口规范采用 OpenRPC（JSON-RPC 2.0）形态，统一遵循 Domain.Action 的方法命名与 /domain/action 的 HTTP 路径约定。
- 示例健康检查接口：Domain 为 health，Action 为 ping，对应路径 /health/ping、方法名 health.ping。

## 技术栈

- NestJS 10（CLI 构建与脚手架）
- TypeScript（目标：CommonJS）
- JSON-RPC 2.0（OpenRPC 约定）
- Pino（日志）
- Sequelize + Postgres / Mongoose + Mongo

## 快速开始

- 开发启动

```bash
pnpm -C apps/backend-integrated run dev
```

- 构建与运行

```bash
pnpm -C apps/backend-integrated run build
node apps/backend-integrated/dist/main.js
```

- 数据库类型生成（Kanel）

```bash
pnpm -C apps/backend-integrated run db:types
```

## OpenRPC 约定（JSON-RPC 2.0）

- 方法命名：Domain.Action（如 health.ping）
- HTTP 路径：/domain/action（如 /health/ping）
- 请求示例：

```json
{ "jsonrpc": "2.0", "id": 1, "params": {} }
```

- 响应示例：

```json
{ "jsonrpc": "2.0", "id": 1, "result": { "ok": true, "ts": 1768826815279 } }
```

- 错误响应（统一 200 状态，error 包含 code/message/data）：

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": { "code": -32600, "message": "Invalid JSON-RPC request" }
}
```

- 协议层校验：
  - RpcRequestPipe：校验 jsonrpc、id（Domain.Action 由路由确定）
  - RpcExceptionFilter：捕获 RpcError 输出标准 JSON-RPC 错误包
