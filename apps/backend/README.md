# CSISP 后端服务文档

## 项目概述

CSISP后端服务是计算机学院综合服务平台的核心组件，提供RESTful API接口，支持用户认证授权、课程管理、考勤管理、作业管理和通知系统等核心功能。后端采用Koa.js框架构建，使用TypeScript开发，通过Sequelize ORM连接PostgreSQL数据库，实现高效稳定的数据处理和业务逻辑执行。

## 技术栈

- **框架**: Koa.js 2.x
- **语言**: TypeScript
- **数据库**: PostgreSQL + Redis
- **ORM**: Sequelize (动态ESM加载)
- **认证**: JWT + Passport
- **API文档**: Swagger/OpenAPI 3.0
- **日志**: Winston
- **构建工具**: esbuild
- **开发工具**: nodemon, tsx

## 项目结构

```
apps/backend/
├── 📁 config/                    # 配置文件
│   └── 📄 config.json            # 数据库和应用配置
├── 📁 scripts/                   # 脚本工具
│   ├── 📄 init_linux.sh          # Linux环境初始化脚本
│   ├── 📄 init_mac.sh            # Mac环境初始化脚本
│   ├── 📄 init_windows.bat       # Windows环境初始化脚本
│   └── 📄 start_backend.sh       # 启动脚本
├── 📁 sequelize/                 # Sequelize相关
│   ├── 📁 migrations/            # 数据库迁移文件
│   ├── 📁 models/                # 数据库模型定义
│   └── 📁 seeders/               # 数据库种子数据
├── 📁 src/                       # 源代码目录
│   ├── 📁 controllers/           # 控制器层
│   │   ├── 📄 BaseController.ts  # 基础控制器
│   │   ├── 📄 UserController.ts  # 用户控制器
│   │   ├── 📄 CourseController.ts # 课程控制器
│   │   ├── 📄 AttendanceController.ts # 考勤控制器
│   │   └── 📄 HomeworkController.ts # 作业控制器
│   ├── 📁 middlewares/           # 中间件层
│   │   ├── 📄 auth.ts            # 认证中间件
│   │   ├── 📄 cors.ts            # CORS中间件
│   │   ├── 📄 error.ts           # 错误处理中间件
│   │   └── 📄 logger.ts          # 日志中间件
│   ├── 📁 models/                # 业务模型接口
│   ├── 📁 routes/                # 路由定义
│   │   ├── 📄 user.ts            # 用户路由
│   │   ├── 📄 course.ts          # 课程路由
│   │   ├── 📄 attendance.ts      # 考勤路由
│   │   └── 📄 homework.ts        # 作业路由
│   ├── 📁 services/              # 业务逻辑层
│   │   ├── 📄 BaseService.ts     # 基础服务
│   │   ├── 📄 UserService.ts     # 用户服务
│   │   ├── 📄 CourseService.ts   # 课程服务
│   │   ├── 📄 AttendanceService.ts # 考勤服务
│   │   └── 📄 HomeworkService.ts # 作业服务
│   ├── 📁 types/                 # 类型定义
│   ├── 📄 app.ts                 # 应用入口
│   ├── 📄 database.ts            # 数据库连接配置
│   └── 📄 initControllers.ts     # 控制器初始化
├── 📁 uploads/                   # 文件上传目录
│   └── 📁 homework/              # 作业文件上传
├── 📄 .sequelizerc               # Sequelize配置
├── 📄 package.json               # 项目配置和依赖
└── 📄 tsconfig.json              # TypeScript配置
```

## 核心功能模块

### 1. 用户管理模块

- **认证与授权**：JWT令牌生成与验证，基于RBAC的权限控制
- **用户管理**：学生、教师、管理员、课代表等多角色用户的CRUD操作
- **角色管理**：角色分配与权限映射

### 2. 课程管理模块

- **课程信息管理**：课程创建、查询、更新和删除
- **班级管理**：班级创建、学生分配
- **教师授课管理**：教师与课程的关联
- **课程表管理**：时间段和课程安排

### 3. 考勤管理模块

- **考勤任务发布**：创建考勤任务，设置时间和地点
- **签到打卡**：学生签到记录
- **考勤统计**：缺勤率、迟到率统计分析

### 4. 作业管理模块

- **作业发布**：创建作业，设置截止日期和要求
- **作业提交**：学生上传作业文件
- **评分系统**：教师评分和反馈
- **提交统计**：提交情况统计和分析

### 5. 通知管理模块

- **通知发布**：多级通知创建和发送
- **阅读状态**：通知阅读状态跟踪
- **通知查询**：基于用户、角色、课程的通知过滤

## API文档

后端服务提供完整的Swagger API文档，可通过以下方式访问：

- **开发环境**: `http://localhost:3000/docs`
- **生产环境**: `http://[your-domain]/docs`

API文档包含所有端点的详细说明、请求参数、响应格式和示例。

## 数据库设计

### 主要数据表

- **users**: 用户信息表
- **roles**: 角色表
- **permissions**: 权限表
- **user_roles**: 用户角色关联表
- **role_permissions**: 角色权限关联表
- **courses**: 课程表
- **classes**: 班级表
- **teachers**: 教师信息表
- **time_slots**: 时间段表
- **schedules**: 课程表
- **attendance_tasks**: 考勤任务表
- **attendance_records**: 考勤记录表
- **homeworks**: 作业表
- **homework_submissions**: 作业提交表
- **homework_files**: 作业文件表
- **notifications**: 通知表

## 开发指南

### 环境准备

1. **Node.js**: 21+ 版本
2. **pnpm**: 最新稳定版本
3. **PostgreSQL**: 15+ 版本
4. **Redis**: 最新稳定版本

### 安装与运行

```bash
# 安装依赖（在项目根目录）
pnpm install

# 初始化数据库
./scripts/init_[os].sh  # 根据操作系统选择对应脚本

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 运行生产版本
pnpm start
```

### 环境配置

配置文件位于 `config/config.json`，包含以下环境配置：

- **development**: 开发环境
- **test**: 测试环境
- **production**: 生产环境

每个环境配置包含数据库连接信息、日志级别等。

## 代码规范

1. **TypeScript**: 严格遵循TypeScript语法，避免使用`any`类型
2. **命名规范**:
   - 类名: 大驼峰式 (如 `UserController`)
   - 方法名: 小驼峰式 (如 `getUserById`)
   - 变量名: 小驼峰式 (如 `userId`)
3. **注释规范**:
   - 类和方法添加JSDoc注释
   - 复杂逻辑添加行内注释
4. **文件结构**: 按照功能模块组织文件

## 错误处理

系统使用统一的错误处理中间件，所有错误返回标准格式：

```json
{
  "code": 错误代码,
  "message": "错误描述",
  "errors": { /* 详细错误信息 */ }
}
```

## 日志系统

使用Winston进行日志记录，支持不同级别的日志：

- **debug**: 开发调试信息
- **info**: 一般信息
- **warn**: 警告信息
- **error**: 错误信息

## 安全措施

1. **JWT认证**: 所有需要认证的接口使用JWT令牌验证
2. **密码加密**: 使用bcrypt进行密码哈希存储
3. **速率限制**: 防止暴力攻击和DoS攻击
4. **输入验证**: 所有用户输入进行严格验证
5. **CORS配置**: 配置安全的跨域策略

## 部署说明

### Docker部署

项目支持Docker容器化部署，可使用根目录的`docker-compose.yml`配置：

```bash
docker-compose up -d backend
```

### 传统部署

1. 构建项目: `pnpm build`
2. 设置环境变量
3. 启动服务: `pnpm start`

## 监控与维护

- **健康检查**: `/health` 端点用于服务状态监控
- **日志轮转**: 配置日志文件定期轮转
- **数据库备份**: 定期备份数据库

## 贡献指南

1. Fork并克隆项目
2. 创建功能分支
3. 编写代码并确保TypeScript编译通过
4. 提交Pull Request

## 许可证

[MIT](LICENSE)
