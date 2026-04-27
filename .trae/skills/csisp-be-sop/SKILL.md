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

> **TODO：** 当前 Schema 定义在 `schemas/` 目录中，与业务逻辑混杂。未来计划抽离为独立的数据访问层（Data Access Layer），统一管理服务端数据模型。

**MongoDB Schema 示例**（以某服务端项目为例）：

```typescript
// apps/backend/{service}/src/modules/forum/schemas/post.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Post extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  authorId: string;

  @Prop({ default: 'default' })
  type: string;

  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: 0 })
  replyCount: number;
}

export const PostSchema = SchemaFactory.createForClass(Post);
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

### 3.1 目录结构

```
apps/backend/{service}/src/
├── modules/
│   └── {domain}/
│       ├── schemas/
│       │   └── {entity}.schema.ts
│       ├── dto/
│       │   ├── {action}.dto.ts
│       │   └── index.ts
│       ├── {domain}.service.ts
│       ├── {domain}.grpc.controller.ts
│       ├── {domain}.module.ts
│       └── index.ts
└── app.module.ts
```

### 3.2 MongoDB 建模

**文件**：`apps/backend/{service}/src/modules/{domain}/schemas/{entity}.schema.ts`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class {Entity} extends Document {
  @Prop({ required: true })
  field1: string;

  @Prop({ type: () => String, required: true })
  field2: string;

  @Prop({ default: 0 })
  field3: number;
}

export const {Entity}Schema = SchemaFactory.createForClass({Entity});
```

### 3.3 DTO 定义

**文件**：`apps/backend/{service}/src/modules/{domain}/dto/{action}.dto.ts`

```typescript
import { CreatePostRequest } from '@csisp-api/{service}';

export class CreatePostDto implements CreatePostRequest {
  title: string;
  content: string;
  authorId: string;
  type?: string;
}
```

**文件**：`apps/backend/{service}/src/modules/{domain}/dto/index.ts`

```typescript
export * from './create-post.dto';
export * from './get-post-detail.dto';
// ... 其他 DTO
```

### 3.4 Service 实现

**文件**：`apps/backend/{service}/src/modules/{domain}/{domain}.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { {Entity}, {Entity}Schema } from './schemas/{entity}.schema';
import { Create{Entity}Dto } from './dto/create-{entity}.dto';

@Injectable()
export class {Domain}Service {
  private readonly logger = new Logger({Domain}Service.name);

  constructor(
    @InjectModel({Entity}.name)
    private readonly {entity}Model: Model<{Entity}>,
  ) {}

  async create(createDto: Create{Entity}Dto): Promise<{Entity}> {
    const created = new this.{entity}Model(createDto);
    return created.save();
  }

  async findAll(): Promise<{Entity}[]> {
    return this.{entity}Model.find().exec();
  }

  async findOne(id: string): Promise<{Entity} | null> {
    return this.{entity}Model.findById(id).exec();
  }
}
```

### 3.5 Controller 实现

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

### 3.6 Module 注册

**文件**：`apps/backend/{service}/src/modules/{domain}/{domain}.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { {Domain}Service } from './{domain}.service';
import { {Domain}GrpcController } from './{domain}.grpc.controller';
import { {Entity}, {Entity}Schema } from './schemas/{entity}.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: {Entity}.name, schema: {Entity}Schema }]),
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
import { {Domain}Module } from './modules/{domain}/{domain}.module';

@Module({
  imports: [
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

---

_本文档基于论坛系统开发经验总结而成，包含踩过的坑与最佳实践。_
