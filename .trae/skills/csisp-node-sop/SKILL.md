---
name: 'csisp-node-sop'
description: 'CSISP node 端开发 SOP。在进行 Node.js 服务端开发、涉及数据库变更、IDL 接口定义或需要进行逻辑重构时调用此 Skill。'
---

# CSISP Node 端开发 SOP

本 Skill 规定了 CSISP 项目服务端开发的标准作业程序，旨在维护“唯一事实源 (SSOT)”原则并保持架构一致性。

## 1. 数据库持久化流程 (Database-First)

**唯一事实源**：[`infra/database`](file:///Users/bytedance/project/CSISP/infra/database)

- **变更步骤**：
  1. 在 `infra/database/schema/*.hcl` 或 `migrations/*.sql` 中定义变更。
  2. 运行 `pnpm db:types` 使用 Kanel 生成 TypeScript 类型。
  3. 在 Node 端 `src/infra/postgres/models` 中更新 Sequelize 模型，必须引用生成的类型。
- **红线**：严禁手写 SQL，严禁绕过 `infra/database` 修改数据库。

## 2. 接口与契约流程 (IDL-First)

**唯一事实源**：[`infra/idl`](file:///Users/bytedance/project/CSISP/infra/idl)

- **变更步骤**：
  1. 在 `infra/idl/src/**/*.thrift` 中修改接口或枚举。
  2. 运行 `idl:gen` 生成 Thrift 桩代码和 TS 类型。
  3. 在业务侧使用前，优先追查 IDL 是否已有定义。
- **红线**：禁止在 Controller/Service 中定义与 IDL 重复的本地接口或枚举。

## 3. 逻辑抽象与重构规范

- **识别模式**：多观察重复逻辑，按层级抽离。在跨模块/项目抽离前，**必须向用户确认**其使用范围与必要性：
  - **Module 级**：仅限当前模块（如 `helpers/`）。
  - **Project 级**：跨模块复用（使用 `@infra`, `@modules`, `@common`, `@idp-types`, `@utils` 别名）。
  - **Common 级**：跨应用复用（[`packages/`](file:///Users/bytedance/project/CSISP/packages)）。
- **常量规范**：硬编码必须提升为 `Enum`。涉及安全审计或全站一致性的常量，应优先在 IDL 中声明。
- **模型扩展**：允许在 `models/` 中定义 Kanel 类型之外的虚字段（VIRTUAL）或扩展接口，但必须**慎用并向用户确认**。

## 4. 环境变量与配置规范

- **变更流程**：
  1. 优先在 [`.env`](file:///Users/bytedance/project/CSISP/.env) 和 [`.env.example`](file:///Users/bytedance/project/CSISP/.env.example) 中补充变量定义。
  2. 若涉及 **Secret/敏感类** 字段，必须与用户确认后再添加。
- **封装建议**：全局配置建议通过 `@utils` 助手进行封装，避免直接散落在业务代码中。

## 5. 控制器与可观测性（轻量规范）

- **声明式路由**：JSON-RPC 建议采用类方法路由，配合拦截器自动处理响应包装。
- **日志对齐**：确保新接口能被 `LoggingInterceptor` 正确识别，保持 `rpcMethod` 命名的准确性。

## 6. 路径别名强制要求

所有导入必须使用路径别名，禁止使用深层相对路径（如 `../../..`）：

- `@infra/*`: `src/infra/*`
- `@modules/*`: `src/modules/*`
- `@common/*`: `src/common/*`
- `@idp-types/*`: `src/types/*`
- `@utils/*`: `src/utils/*`
