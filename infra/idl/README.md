# CSISP Thrift IDL（v1）

## 目标

- 以 Thrift IDL 作为统一的接口契约与类型来源
- 面向工作区子包消费，生成 Types（TS）与 Node 运行时（JS）产物
- 版本化目录（当前 v1）；如有破坏性变更，新建 v2 并保留 v1 并行

## 目录结构

- 源文件：`src/<module>/v1/*.thrift`
  - backoffice：`auth.thrift`、`user.thrift`、`db.thrift`、`logs.thrift`、`i18n.thrift`、`common.thrift`
  - backend：课程/作业等领域 IDL
- CLI：`cli/*.ts`（统一入口，使用 tsx 执行）
- 脚本（可选参考）：`scripts/config.sh`、`scripts/gen-ts.sh`、`scripts/gen-js.sh`
- 产物目录（不写入 src）：
  - TypeScript 源（中间产物）：`.generated/ts/<module>/v1/**`
  - TypeScript 编译产物（最终）：`dist/ts/<module>/v1/**`
  - Node 运行时产物（最终）：`dist/js/<module>/v1/**`

## 构建与生成

- CLI 用法（统一入口）：
  - 一次生成（TS + JS）：`pnpm -F @csisp/idl idl:gen`
  - 仅 TS 生成：`pnpm -F @csisp/idl gen:ts`
  - 仅 JS 生成：`pnpm -F @csisp/idl gen:js`
  - 兼容性检查（提示不阻断）：`pnpm -F @csisp/idl idl:check`
  - 版本对比（vN→vN+1）：`pnpm -F @csisp/idl idl:diff`
  - 环境诊断：`pnpm -F @csisp/idl idl doctor`
  - 环境变量（可选）：`IDL_VERSION`（默认 v1）、`IDL_SOURCE_DIR`（单模块源）
  - 模块扫描约定：默认扫描 `backoffice`、`backend`、`idp`
  - 日志：开发环境启用彩色单行输出（pino-pretty），生产环境输出 JSON 结构化日志

## 在应用中使用（apps/backoffice）

- 安装与依赖（工作区内已声明依赖）：
  - backoffice `package.json`：`"@csisp/idl": "workspace:*"`
- 类型导入（推荐）：
  - `import type { IUser, QueryTableResponse } from '@csisp/idl/backoffice'`
- 运行时导入（如需 Thrift JS 客户端/服务桩）：
  - `import { DB } from '@csisp/idl/js/backoffice/v1/DB'`
- 示例（服务端处理器返回结构对齐）：
  - 用户详情：
    - `const user: IUser = { id: 1, username: 'alice', status: 1 }`
  - 数据库只读分页：
    - `const page: QueryTableResponse = { items, page, size, total }`

## 约定与命名

- Thrift 命名空间（backoffice 模块）：
  - `namespace js auth|user|db|logs|i18n|common`
- 字段 ID 稳定不可重排；新增字段尽量使用 `optional`
- 兼容性规则（检查仅提示）：
  - 禁止重复的字段 ID
  - 新增字段建议为 `optional`，避免破坏性变更
- 别名与导出：
  - 包 `exports` 提供聚合入口路径（如 `@csisp/idl/backoffice`）用于类型导入
  - JS 运行时通过 `@csisp/idl/js/<module>/v1/*` 引入

## 演进与版本化

- 新增领域：在相应 `src/<module>/v1` 下增加 `.thrift`
- 破坏性变更：复制到 `v2` 并平滑迁移上下游引用
- CLI 将自动扫描固定模块 `backoffice`、`backend`、`idp`

## 常见问题

- 生成结果写到了 src？
  - 已修正为仅写入 `.generated`（中间）与 `dist`（最终），不会写入 `src`
- 类型找不到？
  - 确认已执行 `pnpm -F @csisp/idl idl:gen`
  - 确认应用已依赖 `@csisp/idl`（workspace）
  - 使用聚合入口 `@csisp/idl/backoffice` 进行类型导入

## 传输与协议（后续服务实现参考）

- Transport：TFramedTransport
- Protocol：TCompactProtocol
