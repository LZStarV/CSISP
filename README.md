# 计算机学院综合服务平台(CSISP)

## 项目概述

计算机学院综合服务平台(CSISP)是一个基于Monorepo架构的教育管理系统，专注于学生考勤管理和作业管理的综合服务系统。平台为计算机学院的师生提供全方位教学管理与服务，旨在通过数字化手段提升教学管理效率，优化师生交互体验，实现教学活动的规范化、流程化和智能化。

## 核心功能模块

1. **用户管理模块**：
   - 多角色用户系统（管理员、学生、课代表、学生干部）
   - 基于RBAC的权限控制
   - 用户登录、信息管理、角色分配

2. **教师信息模块**：
   - 教师信息管理
   - 授课情况管理
   - 上课时间安排

3. **课程管理模块**：
   - 课程信息管理
   - 多教师/多时间段支持
   - 课程与班级、教师的关联管理
   - 自动生成选课信息

4. **考勤管理模块**：
   - 考勤任务发布
   - 学生签到打卡
   - 考勤记录统计分析

5. **作业管理模块**：
   - 作业发布与结束
   - 学生作业提交
   - 提交情况统计

6. **通知管理模块**：
   - 多级通知发布与删除
   - 通知阅读状态管理

## 技术架构

### 后端技术栈

- **框架**：Koa.js 2.x (Node.js)
- **语言**：TypeScript
- **数据库**：PostgreSQL + Redis
- **ORM**：Sequelize（动态ESM加载）
- **缓存**：Redis
- **认证**：JWT + Passport
- **构建工具**：esbuild
- **日志**：Winston
- **异常处理**：Koa-Error-Handler

### 前端技术栈

- **框架**：Vue 3 + Composition API
- **语言**：TypeScript
- **构建工具**：Vite
- **样式**：Sass
- **UI组件库**：Naive-UI
- **状态管理**：Pinia
- **路由**：Vue Router
- **HTTP客户端**：Axios
- **图表库**：ECharts

### 测试技术栈

- **框架**：Vitest
- **类型**：单元测试、集成测试

## 项目结构

CSISP采用Monorepo架构，使用pnpm工作区管理多个项目：

```
CSISP/
├── 📁 apps/                          # 应用层 - 可独立部署的应用
│   ├── 📁 backend/                   # 后端API服务
│   ├── 📁 frontend-admin/            # 后台管理系统前端
│   └── 📁 frontend-client/           # 前台用户系统前端
├── 📁 packages/                      # 共享包层 - 可复用的代码模块
│   ├── 📁 types/                     # 共享类型定义
│   └── 📁 utils/                     # 共享工具函数
├── 📁 docs/                          # 文档层 - 项目文档和指南
│   └── 📁 src/                       # 文档源代码
│       ├── 📁 architecture/          # 架构设计文档
│       ├── 📁 backend/               # 后端开发文档
│       ├── 📁 business/              # 业务需求文档
│       ├── 📁 database/              # 数据库设计文档
│       └── 📁 frontend/              # 前端开发文档
├── 📁 tests/                         # 测试层 - 测试相关文件
├── 📄 package.json                   # Monorepo根配置
├── 📄 pnpm-workspace.yaml           # pnpm工作区配置
└── 📄 docker-compose.yml            # Docker容器编排配置
```

## 快速开始

### 环境准备

1. **Node.js**: 22+ 版本
2. **pnpm**: 最新稳定版本
3. **数据库**: PostgreSQL 15+ 和 Redis
4. **开发工具**: 推荐VSCode + TypeScript插件

### 安装与运行

```bash
# 安装项目依赖
pnpm install

# 启动开发服务器（所有应用）
pnpm dev

# 启动特定应用的开发服务器
pnpm dev:backend       # 仅启动后端
pnpm dev:admin         # 仅启动管理员前端
pnpm dev:client        # 仅启动客户端前端
```

### 数据库初始化

项目提供了初始化脚本，可根据不同操作系统选择对应的脚本：

```bash
# Mac系统
./apps/backend/scripts/init_mac.sh

# Linux系统
./apps/backend/scripts/init_linux.sh

# Windows系统
./apps/backend/scripts/init_windows.bat
```

## 架构特点

- **分层架构**: 清晰分离用户层、前端层、后端层、数据层
- **模块化**: 高内聚低耦合的模块划分，便于扩展和维护
- **安全性**: 严格的权限控制和认证机制
- **可维护性**: 完善的文档体系和清晰的代码结构
- **前后端分离**: 独立部署，灵活扩展

## 开发指南

### 代码规范

- Vue3组件名称使用大驼峰命名法(如：CourseList.vue, AttendanceRecord.vue)
- 为所有Express端点实现RESTful API设计模式
- 编写全面的TypeScript接口和类型定义
- 添加清晰的注释，解释业务逻辑和复杂算法

### 文档说明

详细的项目文档位于 `docs/src/` 目录下，包括：

- **业务文档**: 详细的业务需求和功能描述
- **总体架构设计文档**: 系统架构和组件交互说明
- **技术架构设计文档**: 技术选型和实现细节
- **数据库设计文档**: 数据库模型和关系说明
- **前后端开发文档**: 针对开发人员的具体实现指南

## 贡献指南

欢迎各位开发者参与项目贡献。请确保：

1. 遵循项目的代码规范和架构设计
2. 提交前运行类型检查和基本测试
3. 为新功能提供完整的文档说明
4. 提交PR时请详细描述变更内容和目的
