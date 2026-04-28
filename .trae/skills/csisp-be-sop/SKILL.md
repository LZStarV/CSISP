---
name: 'csisp-be-sop'
description: 'CSISP 后端微服务开发 SOP。Invoke when developing new microservices (Integrated Server, Idp Server, etc.) or adding features to existing services.'
---

# CSISP 后端微服务开发 SOP

---

## 前言

> **按需使用小节：** 本 SOP 的所有小节都是可选的，根据实际需求决定是否执行。
>
> 示例场景：
>
> - 新功能完整开发 → 执行所有小节
> - 只是修复现有 Bug → 可能只需要执行"服务端开发"中的部分内容
> - 只是新增一个接口 → 可能只需要执行"微服务接口设计"和"服务端开发"

> **SOP 变更确认：** 如果用户的需求与本文档 SOP 不一致，先与用户确认差异。如果用户坚持更改，总结该变更对 SOP 的影响，以及 SOP 需要如何调整，再次确认后才更新 SOP。

---

## 1. 规划阶段

### 1.1 需求分析

明确功能需求和业务域划分：

1. **业务域识别**：确定功能属于哪个业务域（如 forum、announce、user 等）
2. **功能列表**：列出需要实现的具体功能点
3. **数据流向**：明确数据的输入、处理、输出流程

### 1.2 数据模型设计

根据数据类型选择合适的存储方案：

| 数据类型                     | 存储方案 | 说明                     |
| ---------------------------- | -------- | ------------------------ |
| 用户相关、权限、配置         | Supabase | 关系型数据，需要事务支持 |
| 内容相关（帖子、公告、评论） | MongoDB  | 文档型数据，灵活扩展     |

> **DAL 现状：** Supabase 和 MongoDB 的数据访问层（DAL）在 `packages/dal` 中，采用 Repository 模式。

**MongoDB 模型示例**（使用 Typegoose，在 `packages/dal/src/types/mongo/{name}.model.ts` 中定义）：

每个模型单独管理，遵循以下目录结构：

```
packages/dal/src/types/
├── mongo/
│   ├── index.ts              # 聚合导出所有 mongo 模型
│   ├── demo.model.ts
│   ├── post.model.ts
│   ├── reply.model.ts
│   └── announcement.model.ts
├── common.types.ts
├── supabase.types.ts
└── index.ts                  # 导出所有类型（保持公共 API 不变）
```

模型文件示例（`post.model.ts`）：

```typescript
import { prop, modelOptions } from '@typegoose/typegoose';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';

@modelOptions({
  schemaOptions: {
    collection: 'posts',
    timestamps: true, // 自动添加 createdAt 和 updatedAt
  },
})
export class Post {
  @prop({ required: true, type: String })
  public title!: string;

  @prop({ required: true, type: String })
  public content!: string;

  @prop({ required: true, type: String })
  public authorId!: string;

  @prop({ type: String, default: 'default' })
  public postType?: string;

  /**
   * 获取文档类型
   */
  public static getDocumentType(): typeof Post {
    return Post;
  }
}

// 导出类型
export type PostDocument = DocumentType<Post>;
export type PostModel = ReturnModelType<typeof Post>;
export type PostInsert = Omit<Post, keyof PostDocument>;
export type PostUpdate = Partial<PostInsert>;
```

在 `mongo/index.ts` 中聚合导出所有模型：

```typescript
export * from './demo.model';
export * from './post.model';
export * from './reply.model';
export * from './announcement.model';
```

在顶级 `types/index.ts` 中保持统一导出：

```typescript
export * from './supabase.types';
export * from './common.types';
export * from './mongo';
```

### 1.3 接口设计原则

- **微服务接口**：通过外部 SDK 工厂仓库定义 gRPC / OpenAPI 接口
- **接口命名**：使用大驼峰命名法（PascalCase），如 `CreatePost`、`GetPostDetail`
- **参数验证**：使用 zod 进行参数校验

---

## 2. 微服务接口设计

### 2.1 gRPC 服务定义

**说明**：gRPC 接口定义在外部 SDK 工厂仓库中，不在本项目直接定义。

**引用方式**：

```typescript
// 在服务端项目中使用 SDK
import { ForumServiceController } from '@csisp-api/{service}';
```

### 2.2 SDK 管理

| SDK 包                     | 用途            | 定义位置     |
| -------------------------- | --------------- | ------------ |
| `@csisp-api/{service}`     | gRPC 服务端接口 | SDK 工厂仓库 |
| `@csisp-api/bff-{service}` | gRPC 客户端接口 | SDK 工厂仓库 |

**依赖示例**（`package.json`）：

```json
{
  "dependencies": {
    "@csisp-api/{service}": "^1.0.0"
  }
}
```

---

## 3. 服务端开发

### 3.1 Supabase 数据库开发流程（如果需要调整数据库结构）

如果需要调整数据库结构，请按以下步骤操作：

1. **本地环境准备**：在本地启动 Docker Supabase，执行 `db:pull` 将预发布环境数据库同步到本地（详细步骤参考 `supabase-dev-workflow`）
2. **结构变更与迁移**：在本地调整数据库结构后，使用 `supabase db diff` 生成迁移文件
3. **类型更新**：调整完成后，运行 `pnpm gen:types:local` 脚本生成新的类型文件（`packages/supabase-sdk/src/types/type.ts`）
4. **重新构建与测试**：更新类型后，在对应项目执行 `build` 并进行测试

> **详细步骤**：完整的 Supabase 数据库开发流程请参考 `supabase-dev-workflow`

### 3.2 目录结构

```
apps/backend/{service}/src/
├── modules/
│   └── {domain}/
│       ├── dto/
│       │   ├── {action}.dto.ts
│       │   └── index.ts
│       ├── service/                    # 服务子目录
│       │   ├── index.ts               # 聚合导出
│       │   ├── {sub-domain}.service.ts
│       │   └── ...                    # 多个服务类
│       ├── {domain}.grpc.controller.ts
│       ├── {domain}.module.ts
│       └── index.ts
└── app.module.ts
```

**服务拆分原则**：

1. 每个服务类职责单一，遵循单一职责原则
2. 服务类之间通过依赖注入协作
3. 通过 `service/index.ts` 进行聚合导出
4. 模块中使用 `import * as DomainServices from './service'` 统一导入

### 3.3 数据访问层 (DAL) 使用

#### 3.3.1 Supabase DAL

对于 Supabase 存储的数据，使用 `@csisp/dal` 包中的 Repository：

1. **在 app.module.ts 中全局导入**（一次配置，所有模块可用）：

```typescript
import { SupabaseDalModule } from '@csisp/dal';

@Module({
  imports: [
    SupabaseDalModule,
    // ...
  ],
})
export class AppModule {}
```

2. **在 Service 中注入并使用 Repository**：

```typescript
import { SupabaseUserRepository } from '@csisp/dal';

@Injectable()
export class AuthService {
  constructor(private readonly userRepository: SupabaseUserRepository) {}

  async getStudent(studentId: string) {
    return this.userRepository.findByStudentId(studentId);
  }
}
```

#### 3.3.2 MongoDB DAL 使用

MongoDB 的模型和 Repository 都在 `@csisp/dal` 包中统一管理，使用 Typegoose 实现。

**步骤 1：定义模型**（如果模型不存在）

在 `packages/dal/src/types/mongo/{name}.model.ts` 中添加模型定义（参考 1.2 节示例），并确保在 `mongo/index.ts` 中正确导出新模型。

**步骤 2：创建 Repository**（如果需要）

在 `packages/dal/src/repositories/mongo/` 中创建 Repository：

```typescript
import { InjectModel } from '@m8a/nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';

import {
  Post,
  type PostDocument,
  type PostInsert,
  type PostUpdate,
} from '../../types';

export class MongoPostRepository {
  constructor(
    @InjectModel(Post)
    private readonly postModel: ReturnModelType<typeof Post>
  ) {}

  async findById(id: string): Promise<PostDocument | null> {
    return this.postModel.findById(id).exec();
  }

  async findAll(): Promise<PostDocument[]> {
    return this.postModel.find().exec();
  }

  async create(data: PostInsert): Promise<PostDocument> {
    const post = new this.postModel(data);
    return post.save();
  }

  async update(id: string, data: PostUpdate): Promise<PostDocument | null> {
    return this.postModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<void> {
    await this.postModel.findByIdAndDelete(id).exec();
  }
}
```

**步骤 3：注册到 MongoDalModule**

在 `packages/dal/src/repositories/mongo/mongo-dal.module.ts` 中注册：

```typescript
import { Module } from '@nestjs/common';
import { TypegooseModule } from '@m8a/nestjs-typegoose';

import { Post } from '../../types';
import { MongoPostRepository } from './post.repository';

@Module({
  imports: [TypegooseModule.forFeature([Post])],
  providers: [MongoPostRepository],
  exports: [MongoPostRepository],
})
export class MongoDalModule {}
```

**步骤 4：在服务中使用**

在应用服务中导入并使用 `MongoDalModule` 和 Repository（参考下面的 3.5 和 3.7 节）。

### 3.4 DTO 定义

**文件**：`apps/backend/{service}/src/modules/{domain}/dto/{action}.dto.ts`

```typescript
import { CreatePostRequest } from '@csisp-api/{service}';
import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CreatePostDto implements CreatePostRequest {
  @IsString()
  title!: string;

  @IsString()
  content!: string;

  @IsString()
  authorId!: string;

  @IsString()
  authorName!: string;

  @IsString()
  @IsOptional()
  postType?: string;
}
```

**分页请求示例**：

```typescript
import { GetPostFeedRequest } from '@csisp-api/{service}';
import { IsInt, IsOptional, Min } from 'class-validator';

export class GetPostFeedDto implements GetPostFeedRequest {
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  pageSize?: number;
}
```

**文件**：`apps/backend/{service}/src/modules/{domain}/dto/index.ts`

```typescript
export * from './create-post.dto';
export * from './get-post-feed.dto';
export * from './get-post-detail.dto';
export * from './create-reply.dto';
// ... 其他 DTO
```

**class-validator 常用装饰器**：

| 装饰器          | 说明           |
| --------------- | -------------- |
| `@IsString()`   | 验证是字符串   |
| `@IsInt()`      | 验证是整数     |
| `@IsOptional()` | 字段可选       |
| `@Min()`        | 最小值验证     |
| `@Max()`        | 最大值验证     |
| `@IsBoolean()`  | 验证是布尔值   |
| `@IsEmail()`    | 验证是邮箱格式 |
| `@IsArray()`    | 验证是数组     |

### 3.5 Service 实现

**文件**：`apps/backend/{service}/src/modules/{domain}/{domain}.service.ts`

使用 `@csisp/dal` 中的 Repository（推荐方式）：

```typescript
import { Injectable, Logger } from '@nestjs/common';
import {
  MongoPostRepository,
  type PostInsert,
  type PostDocument,
} from '@csisp/dal';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class ForumService {
  private readonly logger = new Logger(ForumService.name);

  constructor(
    private readonly postRepository: MongoPostRepository // 注入 Repository
  ) {}

  async create(createDto: CreatePostDto): Promise<PostDocument> {
    const insertData: PostInsert = {
      title: createDto.title,
      content: createDto.content,
      authorId: createDto.authorId,
      type: createDto.type,
    };
    return this.postRepository.create(insertData);
  }

  async findAll(): Promise<PostDocument[]> {
    return this.postRepository.findAll();
  }

  async findOne(id: string): Promise<PostDocument | null> {
    return this.postRepository.findById(id);
  }
}
```

### 3.6 Controller 实现

**文件**：`apps/backend/{service}/src/modules/{domain}/{domain}.grpc.controller.ts`

```typescript
import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { {Domain}Service } from './{domain}.service';

@Controller()
export class {Domain}GrpcController {
  private readonly logger = new Logger({Domain}GrpcController.name);

  constructor(private readonly {domain}Service: {Domain}Service) {}

  @GrpcMethod('ForumService', 'CreatePost')
  async createPost(data: CreatePostDto) {
    this.logger.log('Creating post', data);
    return this.{domain}Service.create(data);
  }

  @GrpcMethod('ForumService', 'GetPostDetail')
  async getPostDetail(data: { postId: string }) {
    return this.{domain}Service.findOne(data.postId);
  }
}
```

### 3.7 Module 注册

**文件**：`apps/backend/{service}/src/modules/{domain}/{domain}.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { MongoDalModule } from '@csisp/dal';  // 导入 MongoDB DAL 模块
import { ForumService } from './forum.service';
import { ForumGrpcController } from './forum.grpc.controller';

@Module({
  imports: [
    MongoDalModule,  // 导入 DAL 模块
  ],
  controllers: [{Domain}GrpcController],
  providers: [{Domain}Service],
  exports: [{Domain}Service],
})
export class {Domain}Module {}
```

**注册到主模块**：`apps/backend/{service}/src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypegooseModule } from '@m8a/nestjs-typegoose';
import { config } from '@config';
import { ForumModule } from './modules/forum/forum.module';

@Module({
  imports: [
    TypegooseModule.forRoot(config.mongo.uri),
    // ... 其他模块
    {Domain}Module,
  ],
})
export class AppModule {}
```

---

## 4. 测试与验证

### 4.1 构建测试

```bash
pnpm -F {service} build
```

### 4.2 类型检查

```bash
pnpm -F {service} tsc --noEmit
```

### 4.3 Lint 检查

```bash
pnpm -F {service} lint
```

---

## 常见场景快速参考

### 场景 1：新增一个微服务

1. 规划阶段：需求分析、数据模型设计
2. 微服务接口设计：与 SDK 工厂仓库协调定义接口
3. 服务端开发：完整执行 3.1-3.6
4. 测试与验证：执行所有检查

### 场景 2：在现有服务中新增接口

1. 微服务接口设计：更新 SDK 定义（外部仓库）
2. 服务端开发：
   - 新增 DTO（3.3）
   - 更新 Service（3.4）
   - 更新 Controller（3.5）
3. 测试与验证

### 场景 3：修复现有功能 Bug

1. 定位问题：Service / Controller / Schema
2. 修复代码
3. 测试与验证
