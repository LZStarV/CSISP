---
name: 'supabase-create-migration'
description: '确认数据库调整内容后生成 Supabase 迁移文件。Invoke when user wants to create a database migration or has made database schema changes.'
---

# Supabase Migration Creator

## 说明

本 Skill 用于在调整数据库结构后，生成 Supabase 迁移文件。

## 步骤

### 1. 确认数据库变更

**首先与用户确认**本次数据库调整都做了什么内容，包括但不限于：

- 新增/修改/删除了哪些表
- 新增/修改/删除了哪些字段
- 新增/修改/删除了哪些索引
- 新增/修改/删除了哪些约束（外键、唯一约束等）
- 其他结构变更

### 2. 生成迁移文件

确认变更内容后，在 `supabase/` 目录下执行：

```bash
cd /Users/Admin/project/CSISP/supabase
pnpm supabase db diff -f <迁移文件名称> --use-migra --schema public
```

> **迁移文件名称约定**：使用有意义的名称，如 `add-user-avatar-column`、`create-post-table` 等，使用 kebab-case 命名。
>
> **重要参数说明**：
>
> - `-f` 或 `--file`：将 diff 结果保存到新的迁移文件（必须使用此参数）
> - `--use-migra`：使用 migra 工具生成 schema diff（推荐，更准确）
> - `--schema public`：只 diff public schema
>
> **注意事项**：
>
> - `supabase migration new` 只会创建空文件，不会自动生成内容
> - 必须使用 `db diff -f` 才能自动生成迁移内容
> - 如果远程数据库已有变更，需要先在本地执行相同的 SQL，然后再生成迁移

### 3. 验证迁移文件

生成迁移文件后，检查：

- 迁移 SQL 是否正确反映了预期的变更
- 是否包含了必要的 CASCADE（删除操作时）
- 其他可能的问题

**常见验证步骤**：

```bash
# 1. 查看生成的迁移文件内容
cat migrations/<生成的迁移文件>.sql

# 2. 再次运行 db diff 确认没有遗漏（应该没有输出）
pnpm supabase db diff --use-migra --schema public

# 3. 如果有输出，说明还有变更未纳入迁移，需要重新生成
```

### 4. 后续步骤

生成迁移文件后，还需要：

- 运行 `pnpm gen:types:local` 更新类型定义（在 `packages/supabase-sdk/` 下）
- 重新构建项目验证类型正确
- 将迁移文件提交到版本控制
- 部署时会自动应用迁移到生产环境

## 参考

- 完整的数据库开发流程请参考 `supabase-dev-workflow`
- RLS 策略相关修改需要特别注意触发器权限问题
