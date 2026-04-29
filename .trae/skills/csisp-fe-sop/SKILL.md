---
name: 'csisp-fe-sop'
description: 'CSISP 前端 + BFF 开发 SOP。Invoke when developing frontend features (Portal, Idp Client, etc.) or BFF interfaces.'
---

# CSISP 前端 + BFF 开发 SOP

---

## 前言

> **按需使用小节：** 本 SOP 的所有小节都是可选的，根据实际需求决定是否执行。
>
> 示例场景：
>
> - 新功能完整开发 → 执行所有小节
> - 只是修复现有页面 Bug → 可能只需要执行"前端开发"中的部分内容
> - 只是新增一个 BFF 接口 → 可能只需要执行"规划阶段（BFF 接口设计）"、"Contracts 定义"、"BFF 开发"

> **SOP 变更确认：** 如果用户的需求与本文档 SOP 不一致，先与用户确认差异。如果用户坚持更改，总结该变更对 SOP 的影响，以及 SOP 需要如何调整，再次确认后才更新 SOP。

---

## 1. 规划阶段

### 1.1 前端页面规划

明确页面结构、路由设计和组件划分：

**页面树示例**：

```
/Forum              # 帖子广场
/Forum/:postId      # 帖子详情
/Announcement       # 公告列表
/Announcement/:id   # 公告详情
```

**组件划分原则**：

| 分类       | 位置                         | 说明         |
| ---------- | ---------------------------- | ------------ |
| 页面级组件 | `pages/{Domain}/components/` | 仅该页面使用 |
| 公共组件   | `src/components/{Domain}/`   | 项目内复用   |

### 1.2 BFF 接口设计

设计 BFF HTTP API 契约：

**路径格式**：`POST /api/{frontend-app}/{domain}/{action}`

**示例**：

```
POST /api/portal/forum/createPost
POST /api/portal/forum/getPostDetail
POST /api/portal/announce/getAnnouncementList
```

### 1.3 翻译文案规划

如果需求涉及新增或修改用户可见文案，需要提前规划翻译工作：

**判断标准**：页面中任何对用户展示的中英文文字都需要翻译，包括但不限于：

- 表单标签 (label)、占位符 (placeholder)
- 按钮文字 (button text)
- 提示信息 (message, notification)
- 错误信息 (error message)
- 标题、副标题 (title, subtitle)

**翻译规划步骤**：

1. **识别翻译 key**：根据现有命名空间确定使用哪个翻译文件
   - `@csisp/idp-client` 相关 → `idp-client.json`
   - `@csisp/portal` 相关 → `portal.json`
   - 通用文案 → `common.json`

2. **命名规范**：遵循 `页面.功能.具体描述` 格式

   ```
   login.email.label        → 登录页-邮箱-标签
   signup.submit            → 注册页-提交按钮
   forgot.init.title        → 忘记密码-初始化-标题
   ```

3. **生成翻译模板**：运行以下命令生成本地翻译文件

   ```bash
   # 为 idp-client 生成翻译模板
   pnpm -F @csisp/i18n generate idp-client

   # 为 portal 生成翻译模板
   pnpm -F @csisp/i18n generate portal
   ```

4. **上传翻译平台**：将生成的 JSON 文件上传到 SimpleLocalize
   - 手动上传或使用 CLI 工具

5. **拉取翻译**：翻译完成后执行
   ```bash
   pnpm -F @csisp/i18n pull:idp-client
   pnpm -F @csisp/i18n pull:portal
   ```

---

## 2. Contracts 定义

### 2.1 目录结构

```
packages/contracts/src/
├── {domain}/
│   └── {domain}.contract.ts
├── constants/
│   └── path-prefix.ts
└── index.ts
```

### 2.2 Path Prefix

**文件**：`packages/contracts/src/constants/path-prefix.ts`

```typescript
export const PATH_PREFIX = {
  // 新增业务域前缀（以 portal 前端应用为例）
  PORTAL_FORUM: '/api/portal/forum',
  PORTAL_ANNOUNCE: '/api/portal/announce',
} as const;
```

### 2.3 Contract 定义

**文件**：`packages/contracts/src/{domain}/{domain}.contract.ts`

```typescript
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { buildActionMapFromRoutes } from '../constants/action';
import { HTTP_METHOD } from '../constants/http';
import {
  PORTAL_PATH_PREFIX,
  PORTAL_FORUM_PATH_PREFIX,
} from '../constants/path-prefix';

const c = initContract();

// 注意：所有需要在 BFF/前端 中使用的 schema 都需要 export
export const createPostBodySchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1),
});

export const createPostResponseSchema = z.object({
  post: z
    .object({
      id: z.string(),
      title: z.string(),
      content: z.string(),
      authorId: z.string(),
      authorName: z.string(),
      postType: z.string(),
      createdAt: z.string(),
      updatedAt: z.string(),
    })
    .optional(),
  code: z.number(),
  message: z.string(),
});

const portalForumRoutes = {
  createPost: {
    method: HTTP_METHOD.POST,
    path: PORTAL_FORUM_PATH_PREFIX + '/createPost',
    body: createPostBodySchema,
    responses: {
      200: createPostResponseSchema,
    },
    summary: '创建帖子',
  },
  // ... 其他路由
} as const satisfies Parameters<typeof c.router>[0];

export const portalForumContract = c.router(portalForumRoutes, {
  pathPrefix: PORTAL_PATH_PREFIX,
  strictStatusCodes: true,
});

export const PORTAL_FORUM_ACTION = buildActionMapFromRoutes(portalForumRoutes);
```

**导出**：`packages/contracts/src/index.ts`

```typescript
export * from './forum/forum.contract';
export * from './announce/announce.contract';
export * from './constants/path-prefix';
```

**重要**：类型文件会通过 `pnpm build` 自动生成到 `{domain}/types/` 目录下，不需要手动写类型。

- Body Schema 会生成 `*Params` 类型
- Response Schema 会生成 `*Result` 类型
- ACTION 常量会生成对应的 `*Action` 类型

---

## 3. BFF 开发

### 3.1 目录结构

```
apps/bff/src/
├── modules/
│   └── {frontend-app}/
│       └── {domain}/
│           ├── {domain}.controller.ts
│           ├── {domain}.module.ts
│           └── index.ts
├── app.module.ts
└── main.ts
```

### 3.2 Controller 实现

**文件**：`apps/bff/src/modules/{frontend-app}/{domain}/{domain}.controller.ts`

```typescript
import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { forumContract } from '@csisp/contracts';
import { TsRest } from '@ts-rest/nest';

@Controller('api/portal/forum')
@ApiTags('Portal - Forum')
export class ForumController {
  private readonly logger = new Logger(ForumController.name);

  @Post('createPost')
  @TsRest(forumContract.createPost)
  async createPost(
    @Body() body: { title: string; content: string; type?: string }
  ) {
    this.logger.log('Creating post', body);

    // TODO: 调用后端服务 SDK
    // const result = await this.forumClient.createPost(body).toPromise();

    return {
      status: 200,
      body: {
        id: '1',
        title: body.title,
        content: body.content,
        authorId: 'user-1',
        type: body.type || 'default',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  }

  @Post('getPostDetail')
  @TsRest(forumContract.getPostDetail)
  async getPostDetail(@Body() body: { postId: string }) {
    this.logger.log('Getting post detail', body);

    // TODO: 调用后端服务 SDK
    // const result = await this.forumClient.getPostDetail(body).toPromise();

    return {
      status: 200,
      body: {
        id: body.postId,
        title: '示例帖子',
        content: '示例内容',
        authorId: 'user-1',
        type: 'default',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  }
}
```

### 3.3 Module 注册

**文件**：`apps/bff/src/modules/{frontend-app}/{domain}/{domain}.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { {Domain}Controller } from './{domain}.controller';

@Module({
  controllers: [{Domain}Controller],
  exports: [],
})
export class {Domain}Module {}
```

**注册到主模块**：`apps/bff/src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { {FrontendApp}Module } from './modules/{frontend-app}/{frontend-app}.module';

@Module({
  imports: [
    // ... 其他模块
    {FrontendApp}Module,
  ],
})
export class AppModule {}
```

---

## 4. 前端开发

### 4.1 组件库确认

在开始开发前，先确认当前项目使用的 UI 组件库：

| 前端应用   | UI 组件库                       |
| ---------- | ------------------------------- |
| portal     | Ant Design Vue (ant-design-vue) |
| idp-client | Ant Design (antd)               |

开发时应尽量使用组件库提供的组件，避免重复造轮子。常用组件包括：

- Layout（Header/Sider/Content）：用于页面布局
- Card：用于内容展示
- Button、Form、Input、Modal、Message：用于交互和提示
- Menu：用于导航菜单
- List、Pagination：用于列表展示和分页

### 4.2 目录结构

```
apps/frontend/{frontend-app}/src/
├── api/
│   ├── caller.ts
│   ├── index.ts
│   ├── forum.ts
│   └── announce.ts
├── components/
│   └── {Domain}/
│       └── {Component}.vue
├── pages/
│   └── {Domain}/
│       ├── index.vue
│       └── components/
│           └── {PageComponent}.vue
├── layouts/
│   └── {App}Layout.vue
└── router/
    └── index.ts
```

### 4.3 Layout 组件

**文件**：`apps/frontend/{frontend-app}/src/layouts/{App}Layout.vue`

```vue
<template>
  <div class="app-layout">
    <Header />
    <div class="app-body">
      <Sider :menu-items="menuItems" />
      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import Header from '@/components/Layout/Header.vue';
import Sider from '@/components/Layout/Sider.vue';

const menuItems = [
  { title: '论坛', path: '/Forum' },
  { title: '公告', path: '/Announcement' },
];
</script>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}
</style>
```

### 4.4 公共组件

**文件**：`apps/frontend/{frontend-app}/src/components/{Domain}/{Component}.vue`

```vue
<template>
  <div class="post-content">
    <h2>{{ post.title }}</h2>
    <div class="meta">
      <span>作者：{{ post.authorId }}</span>
      <span>发布时间：{{ formatDate(post.createdAt) }}</span>
    </div>
    <div class="content" v-html="post.content"></div>
  </div>
</template>

<script setup lang="ts">
interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

defineProps<{
  post: Post;
}>();

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN');
};
</script>

<style scoped>
.post-content {
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.meta {
  color: #666;
  font-size: 14px;
  margin-bottom: 16px;
}

.content {
  line-height: 1.6;
}
</style>
```

### 4.5 页面开发

**文件**：`apps/frontend/{frontend-app}/src/pages/{Domain}/index.vue`

```vue
<template>
  <div class="forum-page">
    <h1>帖子广场</h1>
    <button @click="handleCreatePost">发帖</button>
    <div class="post-list">
      <PostCard
        v-for="post in posts"
        :key="post.id"
        :post="post"
        @click="navigateToDetail(post.id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { forumApi } from '@/api/forum';
import PostCard from './components/PostCard.vue';

interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: string;
}

const router = useRouter();
const posts = ref<Post[]>([]);

onMounted(async () => {
  const result = await forumApi.getPostFeed({ page: 1, pageSize: 20 });
  posts.value = result;
});

const navigateToDetail = (postId: string) => {
  router.push(`/Forum/${postId}`);
};

const handleCreatePost = () => {
  // TODO: 打开创建帖子对话框
};
</script>

<style scoped>
.forum-page {
  padding: 20px;
}

.post-list {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
```

**页面级组件**：`apps/frontend/{frontend-app}/src/pages/{Domain}/components/{PageComponent}.vue`

```vue
<template>
  <div class="post-card" @click="$emit('click')">
    <h3>{{ post.title }}</h3>
    <p>{{ post.content.substring(0, 100) }}...</p>
    <div class="meta">
      <span>{{ post.authorId }}</span>
      <span>{{ formatDate(post.createdAt) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: string;
}

defineProps<{
  post: Post;
}>();

defineEmits<{
  click: [];
}>();

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN');
};
</script>

<style scoped>
.post-card {
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.post-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.meta {
  color: #666;
  font-size: 12px;
  margin-top: 8px;
}
</style>
```

### 4.6 API 调用封装

**API 封装方式**：推荐使用对象封装方式（如 announce.ts），而非简单的 call 方式。

**注意**：不要手动拼接 action 字符串，请使用 contracts 包中提供的常量（如 `PORTAL_FORUM_ACTION.CREATE_POST`）

**文件**：`apps/frontend/{frontend-app}/src/api/portal/forum.ts`

```typescript
import {
  PORTAL_PATH_PREFIX,
  type PortalForumAction,
  type CreatePostParams,
  type CreatePostResult,
  type GetPostFeedParams,
  type GetPostFeedResult,
  type GetPostDetailParams,
  type GetPostDetailResult,
} from '@csisp/contracts';

import { createDomainCall } from '../caller';

const forumCall = createDomainCall<PortalForumAction>(
  PORTAL_PATH_PREFIX,
  'forum'
);

export const forumApi = {
  async createPost(params: CreatePostParams): Promise<CreatePostResult> {
    return await forumCall<CreatePostResult>('createPost', params);
  },

  async getPostFeed(params: GetPostFeedParams): Promise<GetPostFeedResult> {
    return await forumCall<GetPostFeedResult>('getPostFeed', params);
  },

  async getPostDetail(
    params: GetPostDetailParams
  ): Promise<GetPostDetailResult> {
    return await forumCall<GetPostDetailResult>('getPostDetail', params);
  },
};
```

**文件**：`apps/frontend/{frontend-app}/src/api/portal/announce.ts`

```typescript
import {
  PORTAL_PATH_PREFIX,
  type PortalAnnounceAction,
  type GetAnnouncementListParams,
  type GetAnnouncementListResult,
  type CreateAnnouncementParams,
  type CreateAnnouncementResult,
} from '@csisp/contracts';

import { createDomainCall } from '../caller';

const announceCall = createDomainCall<PortalAnnounceAction>(
  PORTAL_PATH_PREFIX,
  'announce'
);

export const announceApi = {
  async getAnnouncementList(
    params: GetAnnouncementListParams
  ): Promise<GetAnnouncementListResult> {
    return await announceCall<GetAnnouncementListResult>(
      'getAnnouncementList',
      params
    );
  },

  async createAnnouncement(
    params: CreateAnnouncementParams
  ): Promise<CreateAnnouncementResult> {
    return await announceCall<CreateAnnouncementResult>(
      'createAnnouncement',
      params
    );
  },
};
```

**文件**：`apps/frontend/{frontend-app}/src/api/idp-client/auth.ts`（IDP 客户端示例）

```typescript
import {
  IDP_CLIENT_PATH_PREFIX,
  type IdpClientAuthAction,
  type LoginParams,
  type LoginResult,
  type VerifyOtpParams,
  type VerifyOtpResult,
  type SendOtpResult,
} from '@csisp/contracts';

import { createDomainCall } from '../caller';

const authCall = createDomainCall<IdpClientAuthAction>(
  IDP_CLIENT_PATH_PREFIX,
  'auth'
);

export const idpClientAuthApi = {
  async login(params: LoginParams): Promise<LoginResult> {
    return await authCall<LoginResult>('login', params);
  },

  async sendOtp(): Promise<SendOtpResult> {
    return await authCall<SendOtpResult>('send-otp', {});
  },

  async verifyOtp(params: VerifyOtpParams): Promise<VerifyOtpResult> {
    return await authCall<VerifyOtpResult>('verify-otp', params);
  },
};
```

### 4.7 菜单与路由

**路由配置**：`apps/frontend/{frontend-app}/src/router/index.ts`

```typescript
import { createRouter, createWebHistory } from 'vue-router';
import AppLayout from '@/layouts/AppLayout.vue';

const routes = [
  {
    path: '/',
    component: AppLayout,
    children: [
      {
        path: '',
        redirect: '/Forum',
      },
      {
        path: 'Forum',
        name: 'Forum',
        component: () => import('@/pages/Forum/index.vue'),
      },
      {
        path: 'Forum/:postId',
        name: 'ForumDetail',
        component: () => import('@/pages/ForumDetail/index.vue'),
      },
      {
        path: 'Announcement',
        name: 'Announcement',
        component: () => import('@/pages/Announcement/index.vue'),
      },
    ],
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
```

**Sider 菜单**：在 Layout 组件中定义

```typescript
const menuItems = [
  { title: '论坛', path: '/Forum' },
  { title: '公告', path: '/Announcement' },
];
```

---

## 4.8 国际化(i18n)使用

### 4.8.1 配置初始化

项目入口文件 (`main.tsx`) 需要引入 i18n 配置：

```typescript
import './i18n';
import 'antd/dist/reset.css';
```

### 4.8.2 使用翻译

在组件中使用 `useTranslation` hook：

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation('common');

  return (
    <Form.Item label={t('login.email.label', '邮箱')}>
      <Input placeholder={t('login.email.placeholder', '请输入邮箱')} />
    </Form.Item>
  );
}
```

**使用要点**：

1. **命名空间**：统一使用 `common` 命名空间

2. **默认值**：始终提供中文默认值作为第二参数

   ```typescript
   t('key', '中文默认值');
   ```

3. **插值变量**：如果翻译 key 包含变量，需要传入替换值
   ```typescript
   t('login.email.length', '邮箱长度为3-128个字符', {
     minLength: 3,
     maxLength: 128,
   });
   ```

### 4.8.3 语言切换

使用 `LanguageSwitcher` 组件或在组件中直接切换：

```typescript
const { i18n } = useTranslation();

// 切换语言
i18n.changeLanguage('en'); // 切换到英语
i18n.changeLanguage('zh'); // 切换到中文
```

### 4.8.4 新增翻译 key 流程

当开发新功能需要新增翻译时：

1. 在对应页面的翻译 JSON 文件中添加 key（中文）
2. 运行 `pnpm -F @csisp/i18n pull:{project}` 拉取最新翻译
3. 如果有新的 key 未翻译，使用代码中的默认值
4. 在 SimpleLocalize 平台补充英文翻译

**翻译文件位置**：

| 项目       | 路径                                                       |
| ---------- | ---------------------------------------------------------- |
| idp-client | `packages/i18n/src/locales/idp-client/{en\|zh}/index.json` |
| portal     | `packages/i18n/src/locales/portal/{en\|zh}/index.json`     |
| common     | `packages/i18n/src/locales/common/{en\|zh}/index.json`     |

---

## 5. 验证与检查

### 5.1 构建测试

```bash
# BFF
pnpm -F bff build

# 前端（以某前端应用为例）
pnpm -F {frontend-app} build
```

### 5.2 类型检查

```bash
# BFF
pnpm -F bff tsc --noEmit

# 前端
pnpm -F {frontend-app} tsc --noEmit
```

### 5.3 Lint 检查

```bash
# BFF
pnpm -F bff lint

# 前端
pnpm -F {frontend-app} lint
```

### 5.4 格式化

```bash
# BFF
pnpm -F bff format

# 前端
pnpm -F {frontend-app} format
```

---

## 常见场景快速参考

### 场景 1：完整新功能开发

1. 规划阶段：前端页面规划 + BFF 接口设计 + **翻译文案规划 (1.3)**
2. Contracts 定义：完整执行 2.1-2.3
3. BFF 开发：完整执行 3.1-3.3
4. 前端开发：完整执行 4.1-4.8
5. 验证与检查：执行所有检查

### 场景 2：新增一个 BFF 接口

1. 规划阶段：BFF 接口设计
2. Contracts 定义：更新 contract（2.3）
3. BFF 开发：更新 Controller（3.2）
4. 验证与检查：BFF 构建 + 类型检查 + Lint

### 场景 3：新增一个页面

1. 翻译规划：确认是否需要翻译 (1.3)
2. 前端开发：
   - 页面组件（4.4）
   - 路由配置（4.6）
   - 菜单更新（4.6）
   - **国际化 (4.8)** 如需要翻译
3. 验证与检查：前端构建 + 类型检查 + Lint + 格式化

### 场景 4：修复现有功能 Bug

1. 定位问题：前端组件 / BFF Controller / Contract
2. 修复代码
3. 验证与检查
