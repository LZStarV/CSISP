# 命名统一

- 将前端子项目 `apps/frontend-client` 重命名为 `apps/frontend-portal`（包名改为 `@csisp/frontend-portal`），与 BFF 命名空间 `portal` 一致。
- 更新所有文档与脚本引用：架构文档中的 FE_client 统一改为 FE_portal；工作区与部署脚本指向新路径与包名。

# 概述

- 目标：在 monorepo 中创建 Koa 2 的 BFF 应用，统一聚合接口、前置鉴权与限流、规范 DTO 校验与类型契约；同时完成前端子项目重命名以消除歧义。
- 范围：创建 `apps/bff/` 项目骨架、路由分组、控制器与服务分层、上游客户端封装、运行时校验、通用中间件装配、开发脚本与测试、部署与网关代理；重命名前端子项目并同步工作区与文档。

## 工作区与依赖

- 更新 `pnpm-workspace.yaml`：
  - 增加 `apps/bff`。
  - 将 `apps/frontend-client` 替换为 `apps/frontend-portal`。
- 根 `package.json` 增加脚本：`dev:bff`、`build:bff`、`start:bff`；更新前端脚本别名至 `frontend-portal`。
- BFF 依赖：`koa`、`@koa/router`、`koa-bodyparser`、`zod`、`undici`、`dotenv`。
- 复用 `packages/*`：`@csisp/types`、`@csisp/utils`（后续可扩展 `@csisp/middlewares`、`@csisp/validation`、`@csisp/http`）。

## 目录结构

```
apps/bff/
├── app.ts
├── package.json
├── tsconfig.json
├── src/
│   ├── router/
│   │   ├── index.ts
│   │   ├── admin.ts
│   │   └── portal.ts
│   ├── controllers/
│   │   ├── admin/
│   │   └── portal/
│   ├── services/
│   │   ├── common/
│   │   ├── admin/
│   │   └── portal/
│   ├── clients/
│   ├── middleware/
│   ├── schemas/
│   ├── types/
│   └── utils/
└── .env.example
```

## 配置文件

- `apps/bff/package.json`：ESM、脚本与依赖。
- `apps/bff/tsconfig.json`：严格类型，`module` 与 `target` 对齐 Node 22。
- `.env.example`：`BE_COURSE_URL`、`BE_ATT_URL`、`BE_HW_URL`、`JWT_ISSUER`。

## 路由设计

- 路由前缀：`/api/bff/*`。
- 分组命名空间：`/api/bff/admin/*` 与 `/api/bff/portal/*`。
- `router/index.ts` 统一挂载与 `allowedMethods()`。

## 中间件栈

- 启动顺序：`error` → `cors` → `logger` → `bodyparser` → `jwtAuth` → `rateLimit` → `router`。
- 错误、CORS、日志、JWT、限流按模块分别实现，保证可抽离到 `packages/`。

## 运行时校验（schemas）

- 使用 `zod` 定义 DTO 请求查询与参数规则；控制器入口校验后写入 `ctx.state`。

## 服务与聚合

- `services/common/aggregation.service.ts`：`aggregateStudentDashboard(userId)` 并发调用课程、考勤、作业，返回聚合视图。
- `services/admin/*` 与 `services/portal/*`：按需放置差异化规则。

## 上游客户端封装

- 基于 `undici` 封装：基地址、超时、重试、统一错误包装；注入 `X-User-Id`、`X-User-Roles`。

## 类型契约

- 对齐 `@csisp/types` 的领域类型；在 BFF `types` 中定义聚合响应类型，`snake_case ↔ camelCase` 在服务层统一转换。

## 开发脚本

- `dev:bff`：`tsx apps/bff/app.ts` 或 `node --loader tsx`。
- `build:bff`：`tsc -p apps/bff/tsconfig.json`。
- `start:bff`：`node dist/app.js`。

## 测试与验收

- 合约测试与集成测试覆盖 `admin` 与 `portal` 命名空间；验收标准为路由可用、校验生效、鉴权与限流正确、聚合结果与后端一致。

## 部署与网关

- `docker-compose.yml` 增加 `bff` 服务。
- Nginx 将 `/api/*` 代理到 BFF；领域路由留灰度路径。

## 前端子项目重命名步骤

1. 将目录 `apps/frontend-client` 重命名为 `apps/frontend-portal`。
2. 更新该包 `package.json` 的 `name` 为 `@csisp/frontend-portal`，脚本保持不变。
3. 更新 `pnpm-workspace.yaml`、根 `package.json` 中任何脚本引用（如 `dev:frontend-portal`）。
4. 全文档替换：架构文档中的 FE_client 改为 FE_portal，Mermaid 图节点同步更新。
5. 若存在 CI/CD 配置、Docker/Nginx 路径引用，同步替换为新目录（当前影响预计较小）。

## BFF 实施步骤

1. 新增 `apps/bff` 文件：`package.json`、`tsconfig.json`、`app.ts`、`.env.example`。
2. 创建路由：`router/index.ts`、`router/admin.ts`、`router/portal.ts`，完成命名空间挂载。
3. 添加中间件：`error`、`cors`、`logger`、`jwtAuth`、`rateLimit`，在 `app.ts` 装配。
4. 编写 `schemas/dashboard.schema.ts` 与校验适配器。
5. 实现 `services/common/aggregation.service.ts` 与客户端封装。
6. 对齐 `@csisp/types` 并在 `src/types/index.ts` 定义聚合响应类型。
7. 更新工作区与根脚本，运行开发环境验证。
8. 增加测试与日志打点，准备部署。

## 样例代码（骨架）

```ts
// apps/bff/app.ts
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import router from './src/router';
import error from './src/middleware/error';
import cors from './src/middleware/cors';
import logger from './src/middleware/logger';
import jwtAuth from './src/middleware/jwtAuth';
import rateLimit from './src/middleware/rateLimit';
const app = new Koa();
app.use(error());
app.use(cors());
app.use(logger());
app.use(bodyParser());
app.use(jwtAuth());
app.use(rateLimit());
app.use(router.routes());
app.use(router.allowedMethods());
app.listen(3000);
```

```ts
// apps/bff/src/router/index.ts
import Router from '@koa/router';
import admin from './admin';
import portal from './portal';
const router = new Router({ prefix: '/api/bff' });
router.use('/admin', admin.routes(), admin.allowedMethods());
router.use('/portal', portal.routes(), portal.allowedMethods());
export default router;
```

```ts
// apps/bff/src/schemas/dashboard.schema.ts
import { z } from 'zod';
export const StudentDashboardQuery = z.object({ userId: z.coerce.number().int().positive() });
```

```ts
// apps/bff/src/services/common/aggregation.service.ts
import { request } from 'undici';
export async function aggregateStudentDashboard(userId: number) {
  const c = request(`${process.env.BE_COURSE_URL}/api/course/enrolled?userId=${userId}`).then(r =>
    r.body.json()
  );
  const a = request(`${process.env.BE_ATT_URL}/api/attendance/summary?userId=${userId}`).then(r =>
    r.body.json()
  );
  const h = request(`${process.env.BE_HW_URL}/api/homework/pending?userId=${userId}`).then(r =>
    r.body.json()
  );
  const [courses, attendanceStats, pendingHomework] = await Promise.all([c, a, h]);
  return { courses, attendanceStats, pendingHomework };
}
```

```json
// apps/bff/package.json
{
  "name": "@csisp/bff",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx app.ts",
    "build": "tsc",
    "start": "node dist/app.js"
  },
  "dependencies": {
    "koa": "^2",
    "@koa/router": "^12",
    "koa-bodyparser": "^4",
    "undici": "^6",
    "zod": "^3",
    "dotenv": "^16"
  }
}
```

```json
// apps/bff/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "."
  },
  "include": ["app.ts", "src"]
}
```

```env
# apps/bff/.env.example
BE_COURSE_URL=http://localhost:4001
BE_ATT_URL=http://localhost:4002
BE_HW_URL=http://localhost:4003
JWT_ISSUER=csisp
```

## 交付与下一步

- 确认方案后：完成前端重命名与引用更新；创建 `apps/bff/`，落地骨架与脚本，跑通 `/api/bff/portal/health` 与 `/api/bff/portal/dashboard/student` 示例；随后抽离通用能力到 `packages/` 并补充测试与部署配置。
