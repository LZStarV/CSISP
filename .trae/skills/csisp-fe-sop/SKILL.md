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
import { PATH_PREFIX } from '../constants/path-prefix';

const c = initContract();

// 请求/响应 Schema
const createPostSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1),
  type: z.string().optional(),
});

const postSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  authorId: z.string(),
  type: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const forumContract = c.router({
  createPost: {
    method: 'POST',
    path: `${PATH_PREFIX.PORTAL_FORUM}/createPost`,
    body: createPostSchema,
    responses: {
      200: postSchema,
      400: z.object({ error: z.string() }),
    },
  },
  getPostDetail: {
    method: 'POST',
    path: `${PATH_PREFIX.PORTAL_FORUM}/getPostDetail`,
    body: z.object({ postId: z.string() }),
    responses: {
      200: postSchema,
      404: z.object({ error: z.string() }),
    },
  },
});
```

**导出**：`packages/contracts/src/index.ts`

```typescript
export * from './forum/forum.contract';
export * from './announce/announce.contract';
export * from './constants/path-prefix';
```

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

### 4.1 目录结构

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

### 4.2 Layout 组件

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

### 4.3 公共组件

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

### 4.4 页面开发

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

### 4.5 API 调用封装

**文件**：`apps/frontend/{frontend-app}/src/api/forum.ts`

```typescript
import { initClient } from '@ts-rest/core';
import { forumContract } from '@csisp/contracts';
import { caller } from './caller';

export const forumClient = initClient(forumContract, {
  baseUrl: '',
  baseHeaders: {},
  api: caller,
});

export const forumApi = {
  async createPost(body: { title: string; content: string; type?: string }) {
    const result = await forumClient.createPost({ body });
    if (result.status !== 200) {
      throw new Error(result.body.error || '创建失败');
    }
    return result.body;
  },

  async getPostFeed(params: { page: number; pageSize: number }) {
    const result = await forumClient.getPostFeed({ body: params });
    if (result.status !== 200) {
      throw new Error('获取失败');
    }
    return result.body;
  },

  async getPostDetail(postId: string) {
    const result = await forumClient.getPostDetail({ body: { postId } });
    if (result.status !== 200) {
      throw new Error('获取失败');
    }
    return result.body;
  },
};
```

**文件**：`apps/frontend/{frontend-app}/src/api/announce.ts`

```typescript
import { initClient } from '@ts-rest/core';
import { announceContract } from '@csisp/contracts';
import { caller } from './caller';

export const announceClient = initClient(announceContract, {
  baseUrl: '',
  baseHeaders: {},
  api: caller,
});

export const announceApi = {
  async getAnnouncementList(params: { page: number; pageSize: number }) {
    const result = await announceClient.getAnnouncementList({ body: params });
    if (result.status !== 200) {
      throw new Error('获取失败');
    }
    return result.body;
  },
};
```

### 4.6 菜单与路由

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

1. 规划阶段：前端页面规划 + BFF 接口设计
2. Contracts 定义：完整执行 2.1-2.3
3. BFF 开发：完整执行 3.1-3.3
4. 前端开发：完整执行 4.1-4.6
5. 验证与检查：执行所有检查

### 场景 2：新增一个 BFF 接口

1. 规划阶段：BFF 接口设计
2. Contracts 定义：更新 contract（2.3）
3. BFF 开发：更新 Controller（3.2）
4. 验证与检查：BFF 构建 + 类型检查 + Lint

### 场景 3：新增一个页面

1. 前端开发：
   - 页面组件（4.4）
   - 路由配置（4.6）
   - 菜单更新（4.6）
2. 验证与检查：前端构建 + 类型检查 + Lint + 格式化

### 场景 4：修复现有功能 Bug

1. 定位问题：前端组件 / BFF Controller / Contract
2. 修复代码
3. 验证与检查
