---
name: 'csisp-db-server-ops'
description: '在服务器上用 1Panel + Infisical + Atlas 部署/迁移/验证数据库。调用当需初始化或迁移生产库、验证连接、排查凭据/SSL问题、执行备份时。'
---

# CSISP 数据库服务器操作指南

## 适用场景

- 服务器通过 1Panel（Docker Compose）运行 Postgres/Redis/Mongo
- Secrets 由 Infisical 管理；数据库迁移用 Atlas（容器）
- 生产端口仅绑定 127.0.0.1，由 OpenResty 对外反代 API

## 前置准备

- 已在 1Panel 创建并启动数据库编排，三服务 healthy，端口绑定回环
- 服务器已安装 Node.js 20、pnpm、Docker/Compose；可选安装 pg_dump
- 仓库路径：/opt/csisp/CSISP（或等价目录）
- 首次登录 Infisical（一次即可，后续命令不再重复指定域名）

```bash
pnpm exec infisical login --domain http://43.139.43.214/api
```

## 命令说明（服务器）

- 初始化（备份 + 迁移）
  - 作用：如安装了 pg_dump，先做备份；随后执行 Atlas 迁移到最新版本
  - 命令：
    ```bash
    pnpm -F @csisp/infra-database run prod:db:init
    ```
- 仅迁移
  - 作用：不做备份，直接把数据库迁移到最新版本
  - 命令：
    ```bash
    pnpm -F @csisp/infra-database run prod:db:migrate
    ```
- 迁移状态
  - 作用：查看当前数据库迁移版本与待执行列表
  - 命令：
    ```bash
    pnpm -F @csisp/infra-database atlas:migrate:status
    ```
- 连接探测
  - 作用：在注入后执行一次查询，验证连接与当前用户
  - 命令：
    ```bash
    pnpm exec infisical run -- bash -lc 'psql "$DATABASE_URL" -c "SELECT CURRENT_DATABASE(), CURRENT_USER, NOW()"'
    ```
- 导出变量检查
  - 作用：查看生产环境注入的关键变量（用于排查）
  - 命令：
    ```bash
    pnpm exec infisical export --format dotenv --env=prod
    ```

## 变量分工（参考）

- 1Panel 编排（基础设施）
  - POSTGRES_DB、POSTGRES_USER、POSTGRES_PASSWORD、DB_PORT
  - REDIS_PORT、REDIS_PASSWORD
  - MONGO_INITDB_ROOT_USERNAME、MONGO_INITDB_ROOT_PASSWORD、MONGO_INITDB_DATABASE、MONGO_PORT
- Infisical（迁移与应用连接）
  - DATABASE_URL=postgresql://admin:<POSTGRES_PASSWORD>@127.0.0.1:5432/csisp?sslmode=disable
  - DEV_DATABASE_URL（可选，用于 atlas diff/inspect）

## 常见问题与处理

- 密码认证失败（password authentication failed）
  - 原因：Infisical 的 DATABASE_URL 密码与容器已初始化的管理员密码不一致（持久化卷不会因修改环境变量自动变更密码）
  - 处理：以容器实际密码为准，统一 Infisical 的 DATABASE_URL；或用超级用户 ALTER ROLE 修改密码；或重置卷重新初始化
- SSL 报错（pq: SSL is not enabled）
  - 原因：Atlas 默认 SSL，服务器未启用 SSL
  - 处理：在 DATABASE_URL/DEV_DATABASE_URL 末尾加 `?sslmode=disable`
- 域名输入非法
  - 首次登录请输入完整域名含协议与 API 路径：`http://43.139.43.214/api`
  - 登录成功后，后续命令无需重复设置域名
- CLI 安装失败（下载发布资产中断）
  - 处理：镜像下载系统级 Infisical CLI 并 `pnpm i --ignore-scripts`，或临时代理；完成后直接使用系统级 `infisical`

## 操作流程（建议）

- 第一次：登录 → 在 1Panel 启动栈 → 执行初始化 `prod:db:init` → 状态与连接验证
- 后续：当 infra/database/src/migrations/ 增加新迁移 → 执行 `prod:db:migrate` → 验证
