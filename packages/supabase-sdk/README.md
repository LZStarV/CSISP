# @csisp/supabase-sdk

CSISP 项目的 Supabase SDK，提供类型安全的数据库访问能力和 NestJS 集成模块。

## 安装

```bash
pnpm add @csisp/supabase-sdk
```

## 快速开始

### 1. 在 NestJS 模块中引入

```typescript
import { Module } from '@nestjs/common';
import { SupabaseModule } from '@csisp/supabase-sdk';
import { config } from './config';

@Module({
  imports: [
    SupabaseModule.register({
      url: config.supabase.url,
      serviceRoleKey: config.supabase.serviceRoleKey,
      anonKey: config.supabase.anonKey,
    }),
  ],
})
export class AppModule {}
```

### 2. 在 Service 中使用

```typescript
import { Injectable } from '@nestjs/common';
import { SupabaseDataAccess } from '@csisp/supabase-sdk';
import type { Database } from '@csisp/supabase-sdk';

@Injectable()
export class UserService {
  constructor(private readonly sda: SupabaseDataAccess) {}

  async getUserById(id: number) {
    const { data, error } = await this.sda
      .service()
      .from('user')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data; // 类型：Database['public']['Tables']['user']['Row'] | null
  }
}
```

## 类型系统

### 类型导出

SDK 从 `src/types/type.ts` 导出以下类型：

#### 1. **Database** - 数据库类型定义

包含所有表、视图、存储过程和枚举的完整类型定义。

```typescript
import type { Database } from '@csisp/supabase-sdk';
```

**结构**：

```typescript
type Database = {
  public: {
    Tables: {
      user: { Row; Insert; Update };
      oidc_clients: { Row; Insert; Update };
      // ... 其他表
    };
    Views: {
      /* 视图类型 */
    };
    Functions: {
      /* 函数类型 */
    };
    Enums: {
      /* 枚举类型 */
    };
  };
};
```

#### 2. **Json** - JSON 类型

用于表示数据库中的 JSON/JSONB 字段。

```typescript
import type { Json } from '@csisp/supabase-sdk';

type Metadata = {
  tags: string[];
  config: Json;
};
```

### 类型使用方式

#### 获取表的 Row 类型（查询结果）

```typescript
import type { Database } from '@csisp/supabase-sdk';

// 方式 1：直接使用索引访问
type User = Database['public']['Tables']['user']['Row'];

// 方式 2：在函数中使用
async function getUser(
  id: number
): Promise<Database['public']['Tables']['user']['Row'] | null> {
  const { data } = await supabase
    .from('user')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return data;
}
```

#### 获取 Insert 类型（插入数据）

```typescript
type UserInsert = Database['public']['Tables']['user']['Insert'];

const newUser: UserInsert = {
  student_id: '20240001',
  auth_user_id: null,
  enrollment_year: 2024,
  // id 不需要（自增）
};

await supabase.from('user').insert(newUser);
```

#### 获取 Update 类型（更新数据）

```typescript
type UserUpdate = Database['public']['Tables']['user']['Update'];

const updates: UserUpdate = {
  major: 'Computer Science',
  status: 2,
  // 所有字段都是可选的
};

await supabase.from('user').update(updates).eq('id', userId);
```

#### 在本地项目中定义快捷类型（推荐）

为了避免在每个文件中都写长长的类型路径，建议在项目级别定义快捷类型：

```typescript
// apps/backend/idp-server/src/types/database.ts
import type { Database } from '@csisp/supabase-sdk';

export type User = Database['public']['Tables']['user']['Row'];
export type UserInsert = Database['public']['Tables']['user']['Insert'];
export type UserUpdate = Database['public']['Tables']['user']['Update'];
export type OidcClient = Database['public']['Tables']['oidc_clients']['Row'];
```

然后在业务代码中使用：

```typescript
import type { User, UserInsert } from '@/types/database';

async function createUser(data: UserInsert): Promise<User> {
  // ...
}
```

## NestJS 模块

### SupabaseModule

#### 静态注册

```typescript
import { SupabaseModule } from '@csisp/supabase-sdk';

@Module({
  imports: [
    SupabaseModule.register({
      url: 'https://xxx.supabase.co',
      serviceRoleKey: 'service-role-key',
      anonKey: 'anon-key',
    }),
  ],
})
export class AppModule {}
```

#### 配置项

| 字段             | 类型     | 说明                           |
| ---------------- | -------- | ------------------------------ |
| `url`            | `string` | Supabase 项目 URL              |
| `serviceRoleKey` | `string` | 服务角色密钥（用于服务端操作） |
| `anonKey`        | `string` | 匿名密钥（用于用户端操作）     |

### SupabaseDataAccess

注入 `SupabaseDataAccess` 后即可访问数据库：

```typescript
import { Injectable } from '@nestjs/common';
import { SupabaseDataAccess } from '@csisp/supabase-sdk';

@Injectable()
export class MyService {
  constructor(private readonly sda: SupabaseDataAccess) {}

  async doSomething() {
    // 使用 Service Role 客户端（服务端操作）
    const serviceClient = this.sda.service();

    // 使用 User 客户端（需要传入用户 JWT）
    const userClient = this.sda.user(jwtToken);
  }
}
```

#### 方法说明

##### `service(): SupabaseClient`

返回使用 Service Role Key 的客户端，拥有完整权限（绕过 RLS）。

**使用场景**：

- 后台管理功能
- 批处理任务
- 需要绕过行级安全策略的操作

```typescript
const { data } = await this.sda.service().from('user').select('*');
```

##### `user(jwt: string): SupabaseClient`

返回使用用户 JWT 的客户端，受行级安全策略（RLS）约束。

**使用场景**：

- 用户个人数据操作
- 需要遵循权限控制的场景

```typescript
const userClient = this.sda.user(userJwt);
const { data } = await userClient
  .from('user')
  .select('*')
  .eq('id', currentUserId);
```

##### `unwrap<T>({ data, error }): T`

静态工具方法，用于解包 Supabase 响应并自动处理错误。

```typescript
const { data, error } = await this.sda
  .service()
  .from('user')
  .select('*')
  .single();

// 方式 1：手动检查
if (error) throw error;
const user = data;

// 方式 2：使用 unwrap
const user = SupabaseDataAccess.unwrap(
  await this.sda.service().from('user').select('*').single()
);
```

<br />
