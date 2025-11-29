## 命名与包划分

- 新增三个公共子包：
  - `@csisp/middlewares`：Koa 中间件集合（error/cors/logger/rateLimit/jwtAuth）。
  - `@csisp/validation`：Zod 运行时校验适配器（query/body/params）。
  - `@csisp/upstream`：上游服务客户端封装，按协议分层：`http/`（现阶段）、`ws/`（预留）。导出 `createHttpClient` 与未来的 `createWsClient`。
- 选择 `upstream` 而非 `http`，避免与前端 HTTP 封装混淆，并兼容未来协议拓展。

## 目录与文件结构

- `packages/middlewares/`
  - `package.json`、`tsconfig.json`
  - `src/error.ts`、`src/cors.ts`、`src/logger.ts`、`src/rateLimit.ts`、`src/jwtAuth.ts`、`src/index.ts`、`src/types.ts`
- `packages/validation/`
  - `package.json`、`tsconfig.json`
  - `src/query.ts`、`src/body.ts`、`src/params.ts`、`src/index.ts`
- `packages/upstream/`
  - `package.json`、`tsconfig.json`
  - `src/http/client.ts`、`src/http/index.ts`、`src/types.ts`、`src/index.ts`

## API 设计

- middlewares：
  - `error(options?)` → 统一 `{ code, message }`；可配置是否暴露堆栈。
  - `cors(options)` → 允许来源/头/方法；默认安全。
  - `logger(options?)` → 结构化输出；支持自定义写入。
  - `rateLimit({ limit, windowMs, key? })` → 滑窗限流；默认按 `ctx.ip`。
  - `jwtAuth({ issuer, getUser? })` → 解析 Bearer Token 与 `iss` 校验，将 `userId/roles` 写入 `ctx.state`；`getUser` 扩展用户加载。
- validation：
  - `validateQuery(schema)`、`validateBody(schema)`、`validateParams(schema)` → 校验后写入 `ctx.state.query/body/params`；失败返回 400。
- upstream：
  - `createHttpClient({ baseURL, headers?, timeout?, retries?, onError? })` → `get/post/put/del().json()`；统一错误包装；注入 `X-User-Id/X-User-Roles`。

## 依赖与版本策略

- 根 `package.json`：`pnpm.overrides` 统一 `koa/@koa/router/koa-bodyparser/zod/undici`。
- 子包 `peerDependencies`：
  - `@csisp/middlewares`：`koa`。
  - `@csisp/validation`：`zod`。
  - `@csisp/upstream`：`undici`；未来 `ws`。

## 迁移步骤（BFF 优先）

1. 创建三子包骨架与最小实现；添加 `build` 脚本与严格 `tsconfig`。
2. 在 `apps/bff/app.ts` 将本地中间件替换为公共包导入；保留配置一致。
3. 在 `apps/bff/src/router/portal.ts` 等处，替换校验为 `@csisp/validation`。
4. 用 `@csisp/upstream` 替换 `src/clients/*` 的直接 `undici.request`；统一错误处理与头注入。
5. 删除 BFF 本地重复文件或迁移至 `_legacy/` 目录以便回退。
6. 运行 BFF 冒烟与集成验证：`/api/bff/health`、`/api/bff/portal/dashboard/student`。

## Backend 接入（可选）

- 按模块替换中间件为公共实现（error/cors/logger/rateLimit）；保留特有逻辑在薄适配层。

## 测试计划

- 单元测试：
  - `middlewares`：错误处理、预检 CORS、限流窗口、JWT 解析失败路径。
  - `validation`：成功/失败写入 `ctx.state` 行为。
  - `upstream`：超时、重试、非 2xx 错误包装、头注入。
- 集成测试（BFF）：替换后接口返回 200；校验错误 400；日志与限流生效。

## 文档更新

- 在 `docs/src/architecture/BFF架构设计与实施方案.md` 增加公共子包章节与导入示例，统一命名为 `portal/admin`。

## 风险与回退

- 上下文字段名差异 → 中间件支持参数化 `stateKey` 等覆写。
- 行为差异风险 → Upstream 默认行为与旧实现一致，错误集中包装易定位。
- 回退：保留 `_legacy/` 一轮迭代，必要时直接切回。

## 交付物

- 三子包源码、类型与最小测试；BFF 引用替换与冗余文件清理；文档更新与根版约束一致。

## 时间顺序

1. 创建与发布三子包基础实现 → 2) BFF 替换中间件 → 3) BFF 替换校验 → 4) BFF 替换客户端 → 5) 冒烟与集成测试 → 6) 文档与清理 → 7) Backend 按需接入。
