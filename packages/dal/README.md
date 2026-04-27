# @csisp/dal

**CSISP 数据访问层 (Data Access Layer) - 抽象并统一管理所有数据库操作。**

<br />

## 目录结构

```
src/
├── types/
│   ├── common.types.ts      # 通用类型（分页参数等）
│   ├── supabase.types.ts    # Supabase 数据库表类型
│   ├── mongo.types.ts       # MongoDB 模型定义（Typegoose）
│   └── index.ts
├── repositories/
│   ├── supabase/
│   │   ├── user.repository.ts
│   │   ├── mfa-settings.repository.ts
│   │   ├── oidc-client.repository.ts
│   │   ├── supabase-dal.module.ts  # NestJS 封装
│   │   └── index.ts
│   ├── mongo/
│   │   ├── demo.repository.ts
│   │   ├── mongo-dal.module.ts  # NestJS 封装
│   │   └── index.ts
│   └── index.ts
└── index.ts
```

<br />

## 支持的数据库

### 1. Supabase (PostgreSQL)

- **使用方式**: 通过 Supabase SDK 操作
- **类型生成**: 从 Supabase 数据库自动生成
- **位置**: `repositories/supabase/`

### 2. MongoDB

- **使用方式**: 通过 Typegoose + Mongoose 操作
- **类型定义**: 使用装饰器定义模型（代码优先）
- **位置**: `repositories/mongo/`

<br />

## 使用方法 - Supabase

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

## 使用方法 - MongoDB

### 1. 在根模块配置数据库连接

在你的应用根模块中添加 Typegoose 配置：

```typescript
import { TypegooseModule } from '@m8a/nestjs-typegoose';
import { config } from '@config';

@Module({
  imports: [
    TypegooseModule.forRoot(config.mongo.uri),
    // ... 其他模块
  ],
})
export class AppModule {}
```

### 2. 导入 MongoDalModule

在需要使用 MongoDB Repository 的模块中导入：

```typescript
import { MongoDalModule } from '@csisp/dal';

@Module({
  imports: [MongoDalModule],
  controllers: [DemoController],
  providers: [DemoService],
})
export class DemoModule {}
```

### 3. 在 Service 中注入 Repository

直接在你的 Service 中注入并使用：

```typescript
import { MongoDemoRepository, type DemoInsert } from '@csisp/dal';

@Injectable()
export class DemoService {
  constructor(private readonly demoRepository: MongoDemoRepository) {}

  async createDemo(data: DemoInsert) {
    const demo = await this.demoRepository.create(data);
    return demo;
  }

  async getDemoById(id: string) {
    return this.demoRepository.findById(id);
  }
}
```

### 4. 定义新的 MongoDB 模型

在 `types/mongo.types.ts` 中使用 Typegoose 装饰器定义：

```typescript
import { prop, modelOptions } from '@typegoose/typegoose';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';

@modelOptions({
  schemaOptions: {
    collection: 'your_collection_name',
    timestamps: true, // 自动添加 createdAt 和 updatedAt
  },
})
export class YourModel {
  @prop({ required: true, type: String })
  public field1!: string;

  @prop({ type: Number })
  public field2?: number;

  // 实例方法
  public someMethod(): string {
    return this.field1.toUpperCase();
  }

  // 静态方法
  public static async findByField1(value: string) {
    return this.find({ field1: value });
  }
}

// 导出类型
export type YourModelDocument = DocumentType<YourModel>;
export type YourModelType = ReturnModelType<typeof YourModel>;
export type YourModelInsert = Omit<YourModel, keyof YourModelDocument>;
export type YourModelUpdate = Partial<YourModelInsert>;
```

<br />

## 类型系统

### Supabase 类型

从 `@csisp/dal` 导入纯数据库表类型：

```typescript
import type { UserRow, OidcClientRow } from '@csisp/dal';
```

### MongoDB 类型

从 `@csisp/dal` 导入模型和类型：

```typescript
import {
  Demo,
  type DemoDocument,
  type DemoInsert,
  type DemoUpdate,
} from '@csisp/dal';
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

### Supabase 事务

在 Supabase 中实现事务主要通过 **Database Functions (RPC)** 方式。

**推荐方式：封装 Database Functions**

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

**数据库函数中的事务示例**

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

### MongoDB 事务

MongoDB 支持多文档事务（需要副本集），可以通过 Mongoose Session 实现：

```typescript
// 在 Repository 中使用事务
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

export class YourRepository {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async doTransactionalOperation() {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // 事务操作
      await this.yourModel.create([{ ... }], { session });
      await this.otherModel.updateMany({ ... }, { ... }, { session });

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
```
