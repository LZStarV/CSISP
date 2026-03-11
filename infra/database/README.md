# @csisp/infra-database

CSISP 项目中的数据库基础设施子包，职责转为“集中类型生成 + 可选基础数据填充”。数据库结构与迁移由 Supabase 平台集中托管。

---

## 1. 快速使用

- 生成类型（从 Supabase DEV 连接生成）

  ```bash
  # 需具备 Infisical 凭据，变量位于 /database 命名空间（应包含 DATABASE_URL）
  pnpm -F @csisp/infra-database types:build
  ```

  输出目录：`dist/public/`

- 可选：基础数据填充（如需运行一次性脚本）
  ```bash
  pnpm -F @csisp/infra-database db:seed
  ```
  注意：涉及密钥/哈希的初始化请优先在受控环境执行。

---

## 2. 目录结构

```text
infra/database/
├── src/
│   ├── cli/                 # 工具脚本入口 (gen-types.ts)
│   ├── seed/                # 基础种子数据（可选）
│   └── sequelize-client.ts  # 基础设施层通用 DB 客户端（连接 Supabase）
├── dist/                    # 自动生成的 TS 数据库类型包 (Monorepo 消费端入口)
└── package.json             # 脚本定义与子包导出配置
```

---

## 3. 类型消费 (Monorepo)

本项目通过 `package.json` 的 `exports` 字段对外暴露生成的类型。其他子包（如 `idp-server`, `backoffice`）应直接通过包名引用：

```typescript
// 推荐引用方式（直接从包内 public 目录引入）
import type User from '@csisp/infra-database/public/User';
import type { UserId } from '@csisp/infra-database/public/User';
```

> 注意：
>
> 1. 请勿在业务包中直接运行 `kanel`，应统一调用 `pnpm -F @csisp/infra-database types:build`。
> 2. 消费端项目需配置 `moduleResolution: "NodeNext"` 或 `Bundler` 以正确识别子包导出。
