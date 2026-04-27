CSISP 数据库变更与迁移指南（Supabase）

目录结构

- supabase/
  - migrations/ 存放所有迁移 SQL（仓库的唯一事实来源）
  - config.toml Supabase CLI 配置
  - README.md 本指南
  - package.json 常用脚本

先决条件

- 工具安装：已安装 Supabase CLI、Docker。
- 凭据管理：所有变量通过 Infisical 注入，不要在仓库中硬编码。
- 首次登录与链接：
  - 在 supabase 目录执行
    - pnpm run login
    - pnpm run link

常用脚本（位于 supabase/package.json）

- pnpm run login
  - 调起 CLI 登录，写入本地凭据（一次性/凭据过期后再执行）
- pnpm run link
  - 将本地 CLI 链接到项目（使用 SUPABASE_URL_REF）
- pnpm run db:pull
  - 拉取远端数据库结构（首次可能提示确认，选择 Y）
- pnpm run db:reset:dev
  - 在本地将数据库重置到空库，并按顺序回放所有迁移（验证迁移链可重复）
- pnpm run migrations:list
  - 查看“本地迁移文件集”和“远端迁移历史”的对应关系

注意事项

- 只通过迁移演进结构：禁止在控制台或客户端直接改表结构，防止历史漂移。
- 迁移小步可回滚：一个功能一组迁移；DDL 与数据修复（DML）尽量分开。
- 不泄露凭据：所有密钥、URL 从 Infisical 注入；如敏感信息泄露请立即在控制台旋转并更新。
- Dev/Prod 区分：Dev 上生成与验证迁移；Prod 仅在 CI 中执行迁移，不在本机对生产执行。

FAQ

- 提示使用 /private/tmp/.s.PGSQL.5432：常见于未正确传入 --db-url 或未 link，CLI 回退到本地套接字；使用 link 流程可避免。
- FATAL no pg_hba.conf entry … no encryption：直连 URL 未建立 TLS；优先使用 link 流程（受管 TLS）。
- Update remote migration history table?：首次 db pull 提示，选择 Y 将远端历史与本地基线对齐。

参考

- 详细流程请参考：`.trae/skills/supabase-dev-workflow/SKILL.md`
- 脚本入口：supabase/package.json
