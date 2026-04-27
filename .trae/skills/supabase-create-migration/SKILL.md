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
pnpm db:diff --file <迁移文件名称>
```

> **迁移文件名称约定**：使用有意义的名称，如 `add-user-avatar-column`、`create-post-table` 等，使用 kebab-case 命名。

### 3. 验证迁移文件

生成迁移文件后，检查：

- 迁移 SQL 是否正确反映了预期的变更
- 是否包含了必要的 CASCADE（删除操作时）
- 其他可能的问题

### 4. 后续步骤

生成迁移文件后，还需要：

- 运行 `pnpm gen:types:local` 更新类型定义（在 `packages/supabase-sdk/` 下）
- 重新构建项目验证类型正确

## 参考

完整的数据库开发流程请参考 `supabase-dev-workflow`。
