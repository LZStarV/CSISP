CSISP 数据库变更与迁移指南（Supabase）

目录结构

- supabase/
  - migrations/ 存放所有迁移 SQL（仓库的唯一事实来源）
  - config.toml Supabase CLI 配置
  - README.md 本指南
  - package.json 常用脚本（login/link/pull/diff/reset/list）

先决条件

- 工具安装：执行项目根目录 init_mac.sh，自动检查/安装 Supabase CLI 与必备环境。
- 凭据管理：所有变量通过 Infisical 注入，不要在仓库中硬编码。
- 首次登录与链接（dev）：
  - 在 supabase 目录执行
    - pnpm run login
    - pnpm run link:dev

常用脚本（位于 supabase/package.json）

- pnpm run login
  - 调起 CLI 登录，写入本地凭据（一次性/凭据过期后再执行）
- pnpm run link:dev
  - 将本地 CLI 链接到 dev 项目（使用 SUPABASE_URL_REF）
- pnpm run db:pull:dev
  - 拉取远端数据库结构到 supabase/schema.sql（首次可能提示确认，选择 Y）
- NAME=your_feature pnpm run db:diff:dev
  - 基于当前远端结构差异生成一条迁移文件到 supabase/migrations
- pnpm run db:reset:local
  - 在本地将数据库重置到空库，并按顺序回放所有迁移（验证迁移链可重复）
- pnpm run migrations:list
  - 查看“本地迁移文件集”和“远端迁移历史”的对应关系

推荐工作流（本地 → Dev → Prod）

1. 拉取基线
   - pnpm run link:dev
   - pnpm run db:pull:dev（若提示 Update remote migration history table? 选择 Y）
2. 结构变更
   - 根据需求修改数据库结构（建议在本地/隔离环境先验证）
   - NAME=feature_x pnpm run db:diff:dev 生成迁移文件（小步提交、DDL/DML 分离）
3. 本地验证
   - pnpm run db:reset:local 确保从 0 到最新迁移可顺利重放
4. 提交与代码评审
   - 将 supabase/migrations 的新增文件随 PR 提交；确保 CI 执行 reset + 测试通过
5. 应用到 Dev（CSISP-dev）
   - 在 Dev 分支由 CI 执行 supabase migration up（也可在本机先行验证，需 link 到 dev 项目）
6. 上线到 Prod（CSISP）
   - 合并到主干后由 CI 在生产执行 supabase migration up（本机不要直连生产执行）

迁移基线（remote_schema）与一致性

- 第一次 db pull 会生成一条 remote_schema 基线迁移（如 2026xxxxxxxx_remote_schema.sql），并在远端记录为“已应用”。
- 远端“迁移历史表”与本地 migrations 目录必须一一对应。不要删除已提交的迁移文件，尤其是基线文件。
- 常见报错：The remote database's migration history does not match local files…
  - 原因：远端已记录的某条迁移在本地被删除/改名，或新拉取生成了第二条基线。
  - 解决方式（二选一）：
    - 保留远端已记录的基线：删除多余的基线文件，仅保留与远端历史一致的一条；再执行 db pull。
    - 重设基线：对旧基线执行 repair reverted，再对新基线执行 repair applied，然后 db pull。
  - 命令示例（在 supabase 目录，已 link 到 dev）：
    - 标记为已回滚：infisical run -- sh -lc 'supabase migration repair --status reverted <ID>'
    - 标记为已应用：infisical run -- sh -lc 'supabase migration repair --status applied <ID>'
    - 查看状态：infisical run -- supabase migration list

注意事项

- 只通过迁移演进结构：禁止在控制台或客户端直接改表结构，防止历史漂移。
- 迁移小步可回滚：一个功能一组迁移；DDL 与数据修复（DML）尽量分开。
- 种子数据：若需要，请在 supabase/seed.sql 中维护幂等的最小基线数据，并在 CI/持久环境中启用。
- 不泄露凭据：所有密钥、URL 从 Infisical 注入；如敏感信息泄露请立即在控制台旋转并更新。
- Dev/Prod 区分：Dev 上生成与验证迁移；Prod 仅在 CI 中执行迁移，不在本机对生产执行。

FAQ

- 提示使用 /private/tmp/.s.PGSQL.5432：常见于未正确传入 --db-url 或未 link，CLI 回退到本地套接字；使用 link 流程可避免。
- FATAL no pg_hba.conf entry … no encryption：直连 URL 未建立 TLS；优先使用 link 流程（受管 TLS）。
- Update remote migration history table?：首次 db pull 提示，选择 Y 将远端历史与本地基线对齐。

参考

- 脚本入口：supabase/package.json（login、link:dev、db:pull:dev、db:diff:dev、db:reset:local、migrations:list）
- 若需在 CI 中处理生产：先 link 到生产项目，再执行 supabase migration up
