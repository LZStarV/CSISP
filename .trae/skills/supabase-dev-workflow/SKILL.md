---
name: 'supabase-dev-workflow'
description: 'CSISP Supabase 开发/迁移 SOP。需要进行数据库结构变更、生成迁移、Dev 联调、Prod 发布或排查迁移不一致时调用。'
---

# CSISP Supabase 开发与迁移 SOP

目标

- 以迁移为唯一事实来源，确保 Dev/Staging/Prod 三环境结构一致、可回滚、可审计。
- 降低本地与线上偏差风险，规范开发者从本地验证到线上发布的全链路动作。

先决条件

- 工具：已安装 Supabase CLI、Docker。
- 凭据：通过 Infisical 注入，不在仓库硬编码。
  - 必须：`SUPABASE_URL_REF`
  - CI：`SUPABASE_ACCESS_TOKEN`（Supabase PAT）

关键目录与脚本

- 目录：`/supabase`
  - `migrations/` 所有迁移 SQL（唯一事实来源）
  - `config.toml` CLI 配置
  - `README.md` 本指南
  - `package.json` 常用脚本
- 常用脚本（在 `/supabase` 执行）
  - `pnpm run login`：CLI 登录（本机一次性）
  - `pnpm run link`：链接项目（使用 `SUPABASE_URL_REF`）
  - `pnpm run db:pull`：拉取远端结构
  - `pnpm run db:reset:dev`：本地从 0 重放所有迁移，验证链路
  - `pnpm run migrations:list`：比对本地文件与远端历史

标准流程（本地 → Dev/Staging → Prod）

1. 本地准备
   - `pnpm run login`
   - `pnpm run link`
   - 首次基线：`pnpm run db:pull`（提示 Update history 选择 Y）
2. 结构变更与出迁移
   - 完成本地/隔离环境验证后，使用 `supabase db diff` 生成迁移文件
3. 本地重放校验
   - `pnpm run db:reset:dev` 确保迁移链从 0 可完整重放
4. 推送与联调
   - 提交迁移文件随 PR；CI 在 Dev/Staging 执行 `supabase migration up`
5. 合入主干并发布
   - `main` 推送触发 Prod 工作流：`supabase migration up`

迁移基线与一致性

- 第一次 `db:pull` 生成 `remote_schema` 基线，并在远端标记为 applied。
- 严禁删除已提交迁移（尤其基线）；出现 "migration history does not match"：
  - 方案 A：保留远端已记录的基线，删除多余基线文件 → 重新 `db pull`
  - 方案 B：`supabase migration repair --status reverted <旧基线ID>`，再对新基线 `--status applied <新基线ID>` → `db pull`
- 查看/修复命令（在 `/supabase` 且已 link）：
  - `infisical run -- supabase migration list`
  - `infisical run -- sh -lc 'supabase migration repair --status reverted <ID>'`
  - `infisical run -- sh -lc 'supabase migration repair --status applied <ID>'`

常见问题

- 连接到 `/private/tmp/.s.PGSQL.5432`：
  - 未正确 `link` 或 `--db-url` 为空；优先使用 `link` 流程
- `no pg_hba.conf entry … no encryption`：
  - 直连 URL 未建立 TLS；`link` 流程默认受管 TLS
- mismatch 报错：
  - 按"迁移基线与一致性"章节执行 `repair` 对齐后再 `db pull/up`

安全与规范

- 所有凭据经 Infisical 注入；严禁提交密钥/URL 明文
- 生产迁移仅在 CI 执行；本机不对生产执行变更
- 迁移小步、可回滚；避免巨型 SQL；索引/长事务尽量离峰或拆分
