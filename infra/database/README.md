# @csisp/infra-database

CSISP 项目中的数据库基础设施子包，负责 PostgreSQL 的初始化、迁移和基础种子数据管理，并为后续的多语言类型 Codegen 预留入口。

> 核心定位：**DB-first 的数据库生命周期管理**，不承载业务逻辑，不提供 HTTP 服务。

---

## 1. 目录结构概览

```text
infra/database/
├── docker-compose.db.yml       # 本地开发用的 Postgres/Redis/Mongo 容器编排
├── scripts/                    # 本地初始化数据库环境的 shell 脚本
│   ├── common.sh
│   ├── init_linux.sh
│   ├── init_mac.sh
│   └── init_windows.bat
├── src/
│   ├── cli/                    # 数据库相关 CLI 命令入口（tsx 执行）
│   │   ├── db-migrate.ts       # 执行所有 pending 迁移（结构 + 基础种子）
│   │   ├── db-rollback.ts      # 回滚最近一条迁移
│   │   ├── db-status.ts        # 查看已执行/待执行迁移
│   │   ├── db-reset-dev.ts     # 开发环境重置数据库（down to 0 + up）
│   │   └── db-codegen-ts.ts    # TS 侧 Codegen 的占位 CLI
│   ├── codegen/                # 多语言 Codegen 占位目录
│   │   └── ts/
│   │      └── db-codegen-ts.ts # 从 schema/db-schema.json 生成 TS 类型的占位实现
│   ├── config/
│   │   ├── db-env.ts           # 从 .env 解析 DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD
│   │   └── load-env.ts         # 从仓库根目录加载 .env（供 CLI 使用）
│   ├── migrations/             # 所有 PostgreSQL 迁移（DB-first，事实源）
│   │   └── 2026xxxxxxxxxxxx-*.ts # 示例：时间戳前缀 + 描述（create-/seed-base- 等）
│   ├── schema/
│   │   └── db-schema.json      # DB schema 的中立 JSON 快照占位（后续由 introspect 脚本生成）
│   ├── logger.ts               # 基于 @csisp/logger 的子包级日志封装
│   ├── migration-runner.ts     # Umzug + SequelizeStorage 封装（up/down/status）
│   └── sequelize-client.ts     # 专用于迁移/种子的 Sequelize 实例
├── package.json                # @csisp/infra-database 子包配置
└── tsconfig.json               # 继承根 tsconfig，编译为 CommonJS
```

---

## 2. 职责划分

- **infra/database（本子包）**
  - 负责数据库生命周期管理：
    - 启动本地数据库容器（Postgres/Redis/Mongo）
    - 管理 PostgreSQL schema 迁移（所有业务表结构）
    - 管理所有环境必需的基础种子数据（角色、管理员账号等）
  - 暴露统一的 CLI 命令供本地开发和 CI/CD 使用
  - 为 DB introspect + 多语言 Codegen 预留入口和目录

- **backend-integrated**
  - 使用 `@nestjs/sequelize` + `sequelize-typescript` 挂载 ORM 模型
  - 通过 Service 实现业务逻辑
  - 未来会承载 Dev 环境的大量假数据注入（DevSeed 模块），但不再负责结构迁移

---

## 3. 迁移与基础种子

### 3.1 迁移设计

- 采用 **DB-first** 思路：
  - 所有表结构与索引演化由 `src/migrations/*.ts` 定义，是 PostgreSQL 的唯一结构事实源
  - 迁移通过 Umzug 顺序执行，并记录在 `schema_migrations` 表中
- 迁移文件分三类：
  - `*-create-*.ts`：创建/修改表结构与约束
  - `*-seed-base-*.ts`：插入所有环境都需要的**基础种子数据**（例：角色/管理员）
  - 未来如有需要，可新增 `*-alter-*.ts`、`*-drop-*.ts` 作为演化历史
- 所有迁移中：
  - 统一使用 `getSequelize()` 获取连接
  - 在 `sequelize.transaction` 中执行 `createTable`/`dropTable`/`addConstraint` 等操作
  - 时间字段（`created_at`/`updated_at` 等）使用 `sequelize.fn('NOW')` 作为默认值

### 3.2 基础种子

- 通过 `*-seed-base-*.ts` 这类迁移文件注入所有环境都需要的基础数据（如角色、初始账号等）。
- 具体种子内容随业务演进调整，可在对应迁移中查阅实现。

> 注意：大量开发/演示用假数据（课程、班级、学生批量样本等）**不会**放在 migrations 中，后续将由 backend-integrated 内部的 DevSeed 模块负责。

---

## 4. CLI 命令与使用方式

在项目根目录通过 pnpm 调用（假设已在根 package.json 中配置 script 代理）：

```bash
# 启动本地数据库服务（Postgres/Redis/Mongo）
bash infra/database/scripts/init_mac.sh   # macOS

# 执行所有 pending 迁移（结构 + 基础种子）
pnpm -F @csisp/infra-database db:migrate

# 查看迁移状态
pnpm -F @csisp/infra-database db:status

# 回滚最近一条迁移
pnpm -F @csisp/infra-database db:rollback

# （开发环境）重置数据库：清空并重新执行全部迁移
pnpm -F @csisp/infra-database db:reset:dev

# （预留）运行 TS Codegen，占位实现
pnpm -F @csisp/infra-database db:codegen:ts
```

所有 CLI 内部都会：

- 调用 `loadRootEnv()` 自动加载仓库根 `.env`，使用其中的 `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD` 连接数据库；
- 使用 `@csisp/logger` 输出结构化日志，而不是直接使用 `console.*`。

---

## 5. 与 Codegen 的关系

- `src/schema/db-schema.json`：
  - 预留为 DB schema 的中立 JSON 快照文件
  - 未来会通过 introspection 脚本从真实 PostgreSQL 中读取表结构并写入该文件
- `src/codegen/ts/db-codegen-ts.ts`：
  - TS 侧 Codegen 的占位实现
  - 当前仅验证读取 `db-schema.json` 的链路，后续会扩展为：
    - 为 `@csisp/types` 生成 DbXxx 类型
    - 为 backend-integrated 生成 XxxAttributes/XxxCreationAttributes
- Java/Go 等其他语言的 Codegen 将在 `src/codegen/java`、`src/codegen/go` 等目录中按需补充。

---

## 6. 注意事项

- 任何对 PostgreSQL 结构的新增/修改：
  - 必须通过 `infra/database/src/migrations` 提交新的迁移文件
  - 禁止直接在数据库中手动修改结构
- 当迁移影响实体字段时，需要同步更新：
  - `@csisp/types` 对应类型
  - backend-integrated 中的 `sequelize-typescript` 模型与 Service 逻辑
  - 如影响前端/BFF 接口，需更新 `docs/src/` 中相关文档
- 业务层（backend-integrated/BFF）访问数据库时：
  - 不直接使用 Sequelize 原始连接或 SQL 字符串
  - 统一通过 ORM 模型 + Service 完成

---

如需新增迁移或基础种子，推荐参考已有 `create-*` 与 `seed-base-*` 文件的写法，保持事务包裹、幂等性与命名规范的一致。
