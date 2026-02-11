# @csisp/infra-database

CSISP 项目中的数据库基础设施子包，负责数据库的声明式管理、自动化迁移和集中类型生成。

> 核心定位：**基于 Atlas 的声明式模块化数据库生命周期管理**，维护数据库的单一事实源（SSOT）。

---

## 1. 核心架构：声明式 & 模块化

本项目已全面切换为 **基于 Atlas 的声明式模块化管理** 架构。

- **单一事实源 (SSOT)**：[src/schema/](./src/schema/) 目录是数据库结构的唯一标准。
- **模块化设计**：按领域拆分 `.hcl` 文件（如 `user.hcl`, `course.hcl`），避免单文件庞大难以维护。
- **原生注释**：HCL 中包含详细的字段 `comment`，这些注释会自动同步到数据库及生成的 TS 类型中。
- **自动化同步**：通过 `atlas schema apply` 确保本地开发数据库与 HCL 定义保持绝对同步。

---

## 2. 快速使用

### 2.1 初始化环境

在仓库根目录下执行，自动启动容器并应用迁移：

```bash
# macOS / Linux / Windows
bash infra/database/scripts/init_[os].[ext]
```

### 2.2 数据库变更流程 (SOP)

如果你需要修改数据库结构，请遵循以下流程：

1. **修改设计**：在 [src/schema/](./src/schema/) 下找到对应的表文件（或新建文件）进行编辑。
2. **应用变更**：在 `infra/database` 目录下运行 `pnpm db:init`（或手动运行 `atlas schema apply`）将变更同步到本地数据库。
3. **生成类型**：运行 `pnpm types:build`。该脚本会基于当前数据库状态，在 `dist/public/` 下生成最新的 TS 类型。
4. **业务对齐**：根据生成的类型更新业务模块中的 Sequelize 模型或 Service 逻辑。

---

## 3. 常用脚本 (CLI)

| 命令                 | 说明                                                           |
| :------------------- | :------------------------------------------------------------- |
| `pnpm db:init`       | **核心同步**：调用 Atlas 将 `src/schema/` 中的定义同步到数据库 |
| `pnpm types:build`   | **核心生成**：基于当前数据库状态生成 TS 类型包到 `dist/`       |
| `pnpm db:seed`       | **基础填充**：执行基础种子数据注入（TS 编写，已对齐最新架构）  |
| `pnpm atlas:diff`    | 检查当前库与 HCL 定义的差异（漂移校验）                        |
| `pnpm atlas:inspect` | 查看当前数据库结构的 HCL 表示（输出到控制台）                  |

---

## 4. 目录结构

```text
infra/database/
├── src/
│   ├── schema/          # 目标态定义目录 (按表拆分的 .hcl 文件)
│   ├── cli/             # 维护脚本入口 (如 gen-types.ts)
│   ├── seed/            # 基础种子数据定义 (已适配最新架构)
│   └── sequelize-client.ts # 基础设施层通用的 DB 连接客户端
├── dist/                # 自动生成的 TS 数据库类型包 (Monorepo 消费端入口)
├── atlas.hcl            # Atlas 全局配置
├── docker-compose.db.yml # 开发环境基础设施 (PG/Redis/Mongo)
└── package.json         # 脚本定义与子包导出配置
```

---

## 5. 类型消费 (Monorepo)

本项目通过 `package.json` 的 `exports` 字段对外暴露生成的类型。其他子包（如 `idp-server`, `backoffice`）应直接通过包名引用：

```typescript
// 推荐引用方式（直接从包内 public 目录引入）
import type User from '@csisp/infra-database/public/User';
import type { UserId } from '@csisp/infra-database/public/User';
```

> **注意**：
>
> 1. 请勿直接在业务包中运行 `kanel`，应统一调用 `pnpm -F @csisp/infra-database types:build`。
> 2. 消费端项目需配置 `moduleResolution: "NodeNext"` 或 `Bundler` 以正确识别子包导出。
