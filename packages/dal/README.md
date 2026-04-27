# @csisp/dal

**CSISP 数据访问层 (Data Access Layer) - 抽象并统一管理所有数据库操作。**

<br />

## 目录结构

```
src/
├── types/
│   ├── common.types.ts      # 通用类型（分页参数等）
│   ├── supabase.types.ts    # 纯数据库表类型
│   └── index.ts
├── repositories/
│   ├── supabase/
│   │   ├── user.repository.ts
│   │   ├── mfa-settings.repository.ts
│   │   ├── oidc-client.repository.ts
│   │   ├── supabase-dal.module.ts  # NestJS 封装
│   │   └── index.ts
│   └── index.ts
└── index.ts
```

<br />

## 使用方法

### 1. 在根模块全局导入

在你的应用根模块（如 `app.module.ts`）中添加：

```typescript
import { SupabaseDalModule } from '@csisp/dal';

@Module({
  imports: [
    SupabaseDalModule, // 全局导入，所有子模块都能使用
    // ... 其他模块
  ],
})
export class AppModule {}
```

### 2. 在 Service 中注入 Repository

直接在你的 Service 中注入并使用：

```typescript
import { SupabaseUserRepository } from '@csisp/dal';

@Injectable()
export class AuthService {
  constructor(private readonly userRepository: SupabaseUserRepository) {}

  async getStudent(studentId: string) {
    const user = await this.userRepository.findByStudentId(studentId);
    return user;
  }
}
```

<br />

## 类型系统

### 数据库表类型

从 `@csisp/dal` 导入纯数据库表类型：

```typescript
import type { UserRow, OidcClientRow } from '@csisp/dal';
```

### 通用类型

```typescript
import type { PaginationParams } from '@csisp/dal';

// 分页查询
const users = await userRepository.findMany({}, { limit: 20, offset: 0 });
```

### Repository 特定类型

```typescript
import type {
  UserFilterParams,
  UserWithMfa,
  UserRecoveryInfo,
} from '@csisp/dal';
```

<br />

## 事务支持

在 Supabase 中实现事务主要通过 **Database Functions (RPC)** 方式。

### 推荐方式：封装 Database Functions

在 Repository 内部封装包含事务逻辑的 Database Functions，对外暴露统一接口。

**示例：**

```typescript
// SupabaseUserRepository 中已有的事务操作
async resetPassword(studentId: string, newHash: string): Promise<void> {
  // auth_reset_password 是数据库函数，内部可能包含事务逻辑
  const { error } = await this.sda.service().rpc('auth_reset_password', {
    p_student_id: studentId,
    p_new_hash: newHash,
  });

  if (error) throw error;
}
```

### 数据库函数中的事务示例

```plpgsql
-- 在 PL/pgSQL 函数中使用事务
CREATE OR REPLACE FUNCTION public.some_transactional_function(p_param text)
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
  -- 多个操作在一个事务中
  INSERT INTO table1 VALUES (...);
  UPDATE table2 SET ...;

EXCEPTION
  WHEN OTHERS THEN
    -- 发生错误时自动回滚
    RAISE;
END;
$function$;
```

---

## 扩展与未来计划

- [ ] MongoDB 支持（在 `repositories/mongodb/` 下）
