---
title: 01-数据库（PostgreSQL）
description: 数据库迁移、模型约定与健康检查（占位）
editLink: true
outline: deep
---

# 数据库（PostgreSQL）

本页为阶段占位。数据库由 Supabase 集中管理与迁移：

- 目录：`/supabase`（migrations/、config.toml）
- 本地链路：`supabase link` / `supabase db pull` / `supabase db reset`
- 服务端接入：通过 `packages/supabase-sdk`（SupabaseModule + SupabaseDataAccess）
- 访问约束：读优先 RLS（用户态），写经 SECURITY DEFINER RPC（服务端）

关键词：基础设施 基建 数据库 迁移 模型 健康检查
