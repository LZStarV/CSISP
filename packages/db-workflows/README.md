# @csisp/db-workflows

用于统一管理数据库迁移与种子数据：

- PostgreSQL：复用 `@csisp/db-schema` 的迁移与种子脚本（参见 `postgres/`）
- MongoDB：在 `mongo/seed.mjs` 初始化内容集合与示例数据

## 使用

```bash
# 初始化 Mongo 内容集合与示例数据
pnpm -F @csisp/db-workflows run seed:mongo

# 执行 Postgres 迁移与种子
pnpm -F @csisp/db-workflows run migrate:pg
pnpm -F @csisp/db-workflows run seed:pg
```

## 环境变量

- `MONGODB_ENABLED=true|false`
- `MONGODB_URI=mongodb://localhost:27017`
- `MONGODB_DB=csisp`
