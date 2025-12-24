# SCNU 计算机学院综合服务平台(CSISP)

> 本项目目前由 LZStarV 个人施工，并非真正已上线的官方平台代码仓库。

## 环境要求

- **Git**：用于克隆仓库并管理代码版本。
- **Node.js**：遵循仓库根目录 `.nvmrc`，推荐使用 **22.x** 版本。
  - 推荐通过 `nvm` 管理 Node.js 版本，保持与项目脚本一致。
- **pnpm**：作为 monorepo 的包管理器，推荐版本 **10.22.0**（与根 `package.json` 保持一致）。
- **Docker Desktop**：用于运行 PostgreSQL 15 与 Redis 7 等基础设施服务，无需在宿主机单独安装数据库。

## 快速开始

### 环境初始化脚本

在首次克隆仓库后，建议根据当前操作系统执行对应的环境检查与配置脚本：

```bash
bash init_[os].[ext]
```

### 克隆仓库前的推荐 Git 配置（尤其是 Windows）

- 仓库统一使用 **LF (\n)** 作为换行符，由 EditorConfig、Prettier 和 ESLint 共同约束。
- Windows 环境下，建议在 **当前仓库根目录** 先执行（只影响本仓库）：

```bash
git config core.autocrlf input
git config core.eol lf
```

- 建议使用支持 EditorConfig 的编辑器，并确保保存时使用 LF：
  - VS Code：保持 EditorConfig 扩展启用，右下角换行符显示为 `LF`。

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

对于 backend-integrated 等需要连接数据库的后端项目，推荐在本地通过 Docker 启动数据库与 Redis 后再启动服务：

```bash
# 启动数据库基础设施（以 macOS 为例）
bash infra/database/scripts/init_mac.sh

# 初始化数据库结构与种子数据（PostgreSQL）
pnpm -F @csisp/db-workflows run migrate:pg
pnpm -F @csisp/db-workflows run seed:pg

# 初始化 Mongo 内容集合与示例数据
# 需在 .env 设置 MONGODB_URI/MONGODB_DB 并确保 mongo 已启动
pnpm -F @csisp/db-workflows run seed:mongo

# 启动 backend-integrated
pnpm -F @csisp/backend-integrated dev
```

如果数据库初始化脚本执行失败，可以在项目根目录按以下步骤手动完成数据库启动与初始化：

1. 启动 PostgreSQL、Redis 与 Mongo 容器
2. 检查 PostgreSQL 是否就绪
3. 在容器内创建应用用户、数据库并授予权限

```bash
# 1. 启动 PostgreSQL、Redis 与 Mongo 容器（使用 .env 中的环境变量）
docker compose -f infra/database/docker-compose.db.yml --env-file .env up -d postgres redis mongo

# 2. 检查 PostgreSQL 是否就绪（可多次执行，直到状态为 accepting connections）
docker compose -f infra/database/docker-compose.db.yml exec -T postgres pg_isready

# 2.1 检查 MongoDB 是否就绪（可选，需已启动 mongo 服务）
docker compose -f infra/database/docker-compose.db.yml exec -T mongo mongosh --eval "db.runCommand({ ping: 1 })"

# 3. 在容器中创建应用数据库用户（若已存在会提示错误，可忽略）
docker compose -f infra/database/docker-compose.db.yml exec -T postgres \
  psql -U "$POSTGRES_USER" -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD' CREATEDB;"

# 4. 创建应用数据库并指定所有者为应用用户（若已存在会提示错误，可忽略）
docker compose -f infra/database/docker-compose.db.yml exec -T postgres \
  psql -U "$POSTGRES_USER" -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

# 5. 为应用用户授予 public schema 上的全部权限
docker compose -f infra/database/docker-compose.db.yml exec -T postgres \
  psql -U "$POSTGRES_USER" -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;"
```

### 开发依赖后端的 BFF 子项目

项目中 BFF 子项目依赖于后端项目，因此在开发 BFF 项目时，需要先启动后端项目。

```bash
# 启动 BFF 项目
pnpm -F @csisp/bff dev
```

### 开发前端项目

项目中前端项目依赖于 BFF 项目，因此在开发前端项目时，需要先启动 BFF 项目。

```bash
# 启动前端项目
pnpm -F @csisp/frontend-admin dev
pnpm -F @csisp/frontend-portal dev
```

### 代码格式化

- 仓库根目录提供全局格式化命令，仅在需要统一全仓库风格时使用：

```bash
pnpm format
```

- 日常开发推荐只对当前子项目执行格式化：

```bash
pnpm -F [sub-application-name] format
```

- 这些命令会在对应子项目目录内执行 ESLint + Prettier（前端项目会额外执行 Stylelint），避免对整个仓库产生大范围的无关格式化改动。

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

## FAQ

### 1. Windows 下拉取仓库后，ESLint 提示换行符错误 / `pnpm format` 出现大量只改换行的 diff 怎么办？

- GitHub 仓库中的文件统一为 **LF 换行**。在 Windows 上如果开启了自动换行转换（如 `core.autocrlf=true`），本地工作区可能被透明地转换为 **CRLF**，但不会立刻在 `git status` 中显示差异。
- 之后运行 `pnpm format` 时，Prettier 会根据项目配置把文件改回 **LF**，这会让当前工作区相对于 Git 记录的“预期工作区内容”出现大量只改换行的 diff。

避免噪声提交的推荐处理方式：

1. **修正当前仓库的 Git 配置（只对本仓库生效）**：

   ```bash
   git config core.autocrlf input
   git config core.eol lf
   ```

2. **确保编辑器使用 LF 保存文件**：
   - VS Code：右下角将换行符切换为 `LF`，并保持 EditorConfig 配置生效。

3. **如果已经产生了大量“只改换行”的改动且尚未提交**：
   - 确认没有重要未保存的业务代码后，可以使用：

   ```bash
   git reset --hard HEAD
   ```

   - 然后在新的配置下重新运行必要的格式化命令（如仅对当前修改的文件执行，或依靠 `lint-staged`）。

4. **关于提交影响**：
   - 在这种场景下即使将这些 diff 提交到远端，GitHub 上文件的换行格式仍会保持为 LF，但会新增一次包含大量只改换行变更的提交，增加历史噪声，故不推荐在业务提交中混入这类全局换行修正。
