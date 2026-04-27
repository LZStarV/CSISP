# CSISP Supabase

这个目录包含 Supabase 数据库的所有迁移文件和配置。

## 目录结构

```
supabase/
├── migrations/         # 所有数据库迁移 SQL 文件（唯一事实来源）
├── functions/          # Supabase Edge Functions（可选）
├── config.toml         # Supabase CLI 配置
├── package.json        # 常用脚本
└── README.md           # 本文档
```

## 常用脚本

在当前目录（`/supabase`）下执行：

| 命令                       | 说明                                                |
| -------------------------- | --------------------------------------------------- |
| `pnpm run login`           | Supabase CLI 登录（本机一次性）                     |
| `pnpm run link`            | 链接到远程 Supabase 项目（使用 `SUPABASE_URL_REF`） |
| `pnpm run db:pull`         | 拉取远程数据库结构到本地，生成迁移文件              |
| `pnpm run db:reset:dev`    | 本地从 0 重放所有迁移，验证链路完整                 |
| `pnpm run migrations:list` | 对比本地迁移文件与远程历史，查看状态                |

## 标准开发流程

### 1. 本地准备

```bash
# 确保已登录并链接项目
pnpm run login
pnpm run link
```

### 2. 生成迁移文件

完成本地或隔离环境验证后，使用 `supabase db diff` 生成迁移文件：

```bash
supabase db diff --file <migration_description>
```

### 3. 本地验证

在提交前，在本地完整重放所有迁移：

```bash
pnpm run db:reset:dev
```

### 4. 提交与发布

- 迁移文件随 PR 提交到代码库
- CI 会在 Dev/Staging 环境自动执行 `supabase migration up`
- PR 合并到 `main` 后，CI 会自动将迁移应用到生产环境

## 迁移规范

- **迁移是唯一事实来源**：所有数据库结构变更都必须通过迁移文件
- **小步迁移**：保持每个迁移的范围小且单一，便于回滚
- **不可删除已提交迁移**：尤其基线迁移文件，删除会导致历史不一致
