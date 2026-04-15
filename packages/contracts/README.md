# @csisp/contracts

## 简介

`@csisp/contracts` 是 CSISP 项目的核心 API 契约（Contracts）层。它基于 `@ts-rest/core` 和 `Zod` 构建，主要作用是统一管理 BFF（Backend-for-Frontend）与前端之间的接口定义，充当路由、类型、运行时校验以及 API Action 常量的**单一数据源 (Single Source of Truth)**。

通过本包，我们能够实现前端和 BFF 之间的强类型端到端约束，并消除接口维护过程中的重复硬编码（如 HTTP Method、路径、DTO 类型等）。

## 核心特性

- **强类型端到端约束**：前端、BFF共享同一套 API 定义。
- **Zod 运行时校验**：通过 Zod Schema 提供接口入参/出参的运行时校验能力，并与 NestJS 管道无缝结合。
- **SDK 类型对齐左移**：利用 `satisfies z.ZodType<T>` 语法，将底层微服务 SDK（如 `@csisp-api/bff-idp-server`）的类型约束前置到 Contract 定义阶段。
- **单一数据源模式**：直接从路由对象派生 Action 常量，无需双写维护。
- **自动类型生成**：基于 AST 自动扫描 Zod Schema 并生成 TypeScript 类型导出，降低心智负担。

---

## 编写 Contract 与 Route 规范

在本项目中，编写契约需要遵循“单一数据源”和“类型严格对齐”的最佳实践。以下以 `src/idp-server/auth.contract.ts` 为例说明：

### 1. 定义 Zod Schema 并对齐底层 SDK 类型

在定义请求体（Body）或响应（Response）的 Zod Schema 时，应尽量使用 `satisfies z.ZodType<SDK_DTO>` 来确保当前 Schema 结构与底层服务的 DTO 严格匹配。

```typescript
import type { LoginInternalDto } from '@csisp-api/bff-idp-server';
import { z } from 'zod';

// 使用 satisfies 进行类型左移约束
export const loginBodySchema = z.object({
  email: z.string().email().min(5).max(256),
  password: z.string().min(1).max(512),
}) satisfies z.ZodType<LoginInternalDto>;

export const loginResponseSchema = z.object({
  stepUp: z.string().optional(),
  nextSteps: z.array(z.string()).optional(),
});
```

### 2. 定义 Route 对象 (Routes)

提取一个独立的 Route 对象常量，并使用 `as const satisfies Parameters<typeof c.router>[0]` 对其进行类型收窄。这不仅能获得完美的 TS 提示，还能在不破坏字面量推导的前提下保证路由结构的合法性。

```typescript
import { HTTP_METHOD } from '../constants/http';

const idpAuthRoutes = {
  login: {
    method: HTTP_METHOD.POST,
    path: '/login', // 注意：不需要写前缀
    body: loginBodySchema,
    responses: { 200: loginResponseSchema },
    summary: '登录',
  },
  // ... 其他路由
} as const satisfies Parameters<typeof c.router>[0];
```

### 3. 生成 Contract 与 Action 常量

利用定义好的 Route 对象，分别生成 ts-rest 契约实例以及该模块的 Action 常量。

```typescript
import { initContract } from '@ts-rest/core';
import { IDP_AUTH_PATH_PREFIX } from '../constants/path-prefix';
import { buildActionMapFromRoutes } from '../constants/action';

const c = initContract();

// 1. 生成 Contract
export const idpAuthContract = c.router(idpAuthRoutes, {
  pathPrefix: IDP_AUTH_PATH_PREFIX,
  strictStatusCodes: true,
});

// 2. 从路由对象自动派生 Action 常量
// 例如 `login` 路由将自动映射为 `{ LOGIN: 'login' }`
export const IDP_AUTH_ACTION = buildActionMapFromRoutes(idpAuthRoutes);
```

---

## 自动生成 Schema 类型 (Auto Type Generation)

为了避免每次新增 Zod Schema 都需要手动编写冗长的 `export type Xxx = z.infer<typeof xxxSchema>`，本项目提供了一套自动化的类型导出机制。

### 工作机制

1. **扫描与提取**：
   构建脚本会遍历 `src/` 目录下（排除 `constants` 等不需要的目录）的所有 `.contract.ts` 文件。
   利用 TypeScript AST（抽象语法树）解析文件，寻找所有以 `Schema` 结尾的具名导出（如 `loginBodySchema`）。
2. **自动生成 Types**：
   在对应的领域目录下自动创建或覆盖 `types/` 文件夹。
   为每个契约文件生成对应的类型文件，例如为 `auth.contract.ts` 生成 `auth.types.generated.ts`，内容如下：

   ```typescript
   // 自动生成的文件，请勿手动修改！
   import { z } from 'zod';
   import { loginBodySchema } from '../auth.contract';

   export type LoginBody = z.infer<typeof loginBodySchema>;
   ```

3. **自动聚合**：
   在 `types/` 目录下自动生成 `index.ts`，将所有生成的 `.types.generated.ts` 文件聚合导出，方便外部项目直接从 `@csisp/contracts` 引入。

### 触发方式

生成脚本已经挂载到 NPM 生命周期 `prebuild` 中。当你执行以下命令时，类型将自动被提取和生成：

```bash
# 在 contracts 包目录下，或者在项目根目录运行 turbo 任务
pnpm build
```

_注意：生成的_ _`types`_ _目录属于构建产物/中间态，在开发时会自动生成并提交到版本库中，确保各端类型随时可用，无需每次手动推导。_
