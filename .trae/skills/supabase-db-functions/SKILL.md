---
name: 'supabase-db-functions'
description: '定义与创建 Supabase 数据库函数（RPC）的 SOP。遇到需要将写路径改造为 SECURITY DEFINER RPC 或需要在 Dashboard 创建/更新函数时调用。'
---

# Supabase 数据库函数（RPC）SOP

## 适用时机

- 将多表/敏感写入改造为原子写（事务）并沉淀为数据库函数
- 收敛权限边界，避免直接授予表写权限，改为仅授予函数 EXECUTE
- 为应用提供稳定的 RPC 调用点（supabase.rpc）

## 创建步骤（Supabase Dashboard）

1. 打开 Database → Functions → Create new function
2. 按下述“函数配置模板”填写
3. 高级设置：Set search_path to `public`
4. 保存后在 SQL Console 授权执行：`grant execute on function <name>(...) to <role>;`
5. 在服务端以 `supabase.rpc('<name>', {...})` 调用，并记录 code/details/hint

## 函数配置模板（必填项）

- Name of function：函数唯一名称（小写 + 下划线）
- Schema：`public`
- Return type：`integer` / `void` / 其他精确类型
- Arguments：列出参数名与类型，合理设置默认值（如 `p_prev_id integer default null`）
- Behavior：写入/事务类用 `volatile`；只读纯计算可用 `stable`/`immutable`
- Type of Security：写路径一律 `SECURITY DEFINER`；只读函数可视策略选择
- Definition（plpgsql）：
  - 开头 `declare` 定义局部变量
  - 使用 `insert/update ... returning` 获取主键或影响结果
  - 必要时 `exception when others then` 记录并 `raise`
  - 结尾 `return <value>` 或 `return;`
  - 添加 `security definer set search_path to public`

## 质量基线

- 输入校验：对关键参数（client_id/sub/hash/id 等）进行非空与格式检查
- 幂等性：对唯一键（如 `rt_hash`）设计唯一索引并在函数内处理冲突语义
- 审计：写入表保留 `created_at/last_used_at/prev_id/status` 等字段
- 授权：撤销直接表写权限，仅开放函数 EXECUTE 给 service 角色

## 例：刷新令牌发放

- Name of function：`auth_issue_refresh_token`
- Schema：`public`
- Return type：`integer`
- Arguments：`p_client_id text, p_sub text, p_rt_hash text, p_prev_id integer default null`
- Behavior：`volatile`
- Type of Security：`SECURITY DEFINER`
- Definition（plpgsql）：

```sql
declare v_id int;
begin
  insert into refresh_tokens(client_id, sub_hash, rt_hash, status, prev_id, created_at)
  values (p_client_id, p_sub, p_rt_hash, 'active', p_prev_id, now())
  returning id into v_id;
  return v_id;
end
```

## 常见错误与排查

- 403/权限错误：检查是否使用了 `SECURITY DEFINER`、search_path 是否设为 `public`、是否授予了 EXECUTE
- RLS 阻断：写入函数默认绕过 RLS，表直接写仍受 RLS 影响，建议统一走函数
- 类型不匹配：确保 RPC 入参名与函数参数名一致、类型精确匹配
