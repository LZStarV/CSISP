# 计算机学院综合服务平台(CSISP)

## 快速开始

### 初始化环境变量（首次克隆项目）

```bash
cp .env.example .env
# 然后根据本地环境修改 .env 中的密码、端口等配置
```

> 说明：`.env.example` 仅作为示例和约定模板，列出项目需要的环境变量键与典型取值，不直接参与运行。拷贝生成的 `/.env` 用于本地开发，后续如需个人定制（例如调整端口、连接远程数据库等），建议在 `/.env.local` 中覆盖。
>
> 当 `.env.example` 发生变更时：
>
> - 维护者应确保仓库中的 `/.env` 在“变量键集合”上与 `.env.example` 保持一致（新增/删除/重命名变量时同步更新），但默认值可以更贴合本地开发场景。
> - 协作者本地的 `/.env` 不需要每次覆盖，只需在拉取新代码后关注 `.env.example` 的变更：如果新增了必需变量或重命名了变量，再手动补充/调整自己的 `/.env` 或 `/.env.local` 即可。

### 安装依赖

```bash
pnpm i

# 也可以只安装一个子项目的依赖
pnpm -F [sub-application-name] i
```

### 运行子项目

```bash
pnpm -F [sub-application-name] dev
```

### 开发依赖数据库的后端子项目

对于 `apps/backend` 等需要连接数据库的后端项目，推荐在本地通过 Docker 启动数据库与 Redis 后再启动服务：

```bash
# 启动数据库基础设施（以 macOS 为例）
bash infra/database/scripts/init_mac.sh

# 初始化数据库结构与种子数据
pnpm -F @csisp/db-schema run migrate
pnpm -F @csisp/db-schema run seed

# 启动 backend
pnpm -F @csisp/backend dev
```

### 开发前端项目

项目中前端项目依赖于 BFF 项目，因此在开发前端项目时，需要先启动 BFF 项目。

```bash
# 启动 BFF 项目
pnpm -F @csisp/bff dev
```

```bash
# 启动前端项目
pnpm -F @csisp/frontend-admin dev
pnpm -F @csisp/frontend-portal dev
```

### 构建子项目

```bash
pnpm -F [sub-application-name] build
```

## 文档

文档位于 `docs/`，入口为 `docs/index.md`。本地预览与构建：

```bash
pnpm -F @csisp/docs dev
pnpm -F @csisp/docs build
```

## 贡献

- 提交规范：使用 Conventional Commits，功能开发在 feature 分支完成后通过 PR 合入，并尽量关联 Issue。
- 质量要求：在提交前本地通过类型检查、lint 与基础测试，避免引入 TypeScript 编译错误或破坏现有脚本。
- 文档与数据库：涉及接口、数据库或部署流程的改动需同步更新 `docs/` 与 `packages/db-schema` 迁移脚本，禁止直接修改生产数据库结构。
- 安全：不要提交任何密钥、账号口令或访问令牌，统一使用 CI/CD 平台的 Secrets/Environment Variables 管理敏感配置。
