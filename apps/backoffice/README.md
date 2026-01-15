# CSISP Backoffice

## 目标

- 提供后台管理界面（用户、日志、数据库只读）与登录入口
- 采用 Next.js App Router + Ant Design，路由分组实现共享与独立布局
- 与 `@csisp/idl` 契约对齐，使用生成的类型提升静态安全

## 目录结构

- 应用路由：`app/`
  - `(admin)/layout.tsx`：后台共享布局（Header/Aside/PageShell）
  - `(admin)/user-center/page.tsx`、`logs-manage/page.tsx`、`db-manage/page.tsx`
  - `(auth)/layout.tsx`、`(auth)/login/page.tsx`：独立登录布局与页面
  - `api/backoffice/[domain]/[action]/route.ts`：JSON-RPC 动态路由入口
- 业务代码：`src/`
  - `client/`：UI 组件、导航配置、rpc 客户端
  - `server/`：认证与数据库、RPC 分发与 handlers、环境配置
  - `shared/`：JSON-RPC 协议辅助

## 依赖与契约

- 依赖 `@csisp/idl`（workspace）
  - 类型导入：`import type { IUser, QueryTableResponse } from '@csisp/idl/backoffice'`
  - 运行时（如需 Thrift JS 客户端/桩）：`import { DB } from '@csisp/idl/js/backoffice/v1/DB'`
- JSON-RPC
  - 前端：`src/client/utils/rpc-client.ts`
  - 服务端入口：`app/api/backoffice/[domain]/[action]/route.ts`
  - 分发：`src/server/rpc/dispatcher.ts` + `src/server/rpc/registry.ts`
  - 领域 handlers：`src/server/rpc/handlers/*`

## 开发与构建

- 开发：`pnpm -F @csisp/backoffice dev`
- 构建：`pnpm -F @csisp/backoffice build`
- 格式化：`pnpm -F @csisp/backoffice format`

## 路由与布局

- `(admin)` 分组：共享后台布局只需定义一次，组内页面自动套用
- `(auth)` 分组：登录页采用独立居中布局，不使用后台壳
- 根重定向：`/` → `/db-manage`

## 约定

- 仅在服务端组件或 route handler 中使用 Node-only 模块（db、auth）
- 字段与结构需与 `@csisp/idl` 对齐；服务端返回建议使用生成类型
- AntD 使用 ConfigProvider 提供中文 locale 与主题；保持轻量样式自定义

## 环境变量

- `DATABASE_URL`：PostgreSQL 连接（未配置时数据库页降级为空数据）
- `JWT_SECRET`：认证签名密钥
