# CSISP 后端脚本使用指南

本目录包含 CSISP 后端项目的各种自动化脚本，帮助开发者快速搭建和启动开发环境。

## 目录结构

```
scripts/
├── init_mac.sh              # macOS 系统初始化脚本
├── init_linux.sh            # Linux 系统初始化脚本
├── init_windows.bat         # Windows 系统初始化脚本
├── start_backend.sh         # macOS 后端服务启动脚本
├── start_backend_linux.sh   # Linux 后端服务启动脚本
├── start_backend_windows.bat # Windows 后端服务启动脚本
├── seed_data.ts             # TypeScript 种子数据生成脚本
└── seed_data_sources.js     # 种子数据源文件
```

## 快速开始

### 1. 环境初始化

根据您的操作系统选择对应的初始化脚本：

**macOS:**
```bash
bash apps/backend/scripts/init_mac.sh
```

**Linux:**
```bash
bash apps/backend/scripts/init_linux.sh
```

**Windows:**
```batch
apps\backend\scripts\init_windows.bat
```

初始化脚本会自动：
- 检查并安装 Node.js 22.x
- 安装 pnpm 包管理器
- 配置 Docker 环境
- 启动 PostgreSQL 和 Redis 服务
- 运行数据库迁移
- 生成种子数据

### 2. 服务启动

初始化完成后，系统会询问是否立即启动后端服务。您也可以选择手动启动：

**macOS:**
```bash
bash apps/backend/scripts/start_backend.sh
```

**Linux:**
```bash
bash apps/backend/scripts/start_backend_linux.sh
```

**Windows:**
```batch
apps\backend\scripts\start_backend_windows.bat
```

或者直接使用传统方式：
```bash
cd apps/backend
pnpm dev
```

## 启动脚本特性

### 自动环境检查
- ✅ 检查 `.env` 配置文件是否存在
- ✅ 验证依赖安装状态（自动安装缺失依赖）
- ✅ 测试数据库连接
- ✅ 检查端口占用情况

### 智能错误处理
- 详细的错误提示信息
- 具体的解决方案建议
- 优雅的服务关闭机制

### 服务状态监控
- 实时日志显示
- 服务启动状态确认
- 健康检查接口验证

## 常见问题

### Q: 端口被占用怎么办？
A: 启动脚本会检测端口占用情况。如果端口被占用，请：
1. 修改 `.env` 文件中的 `PORT` 配置
2. 或关闭占用该端口的服务

### Q: 数据库连接失败怎么办？
A: 请确保：
1. Docker 服务正在运行
2. PostgreSQL 容器已启动
3. 数据库配置正确（检查 `.env` 文件）

### Q: 依赖安装失败怎么办？
A: 尝试手动安装：
```bash
cd apps/backend
pnpm install
```

## 脚本工作原理

### 初始化脚本流程
1. 操作系统检测与兼容性检查
2. Node.js 环境配置（版本管理器安装）
3. 包管理器安装与版本验证
4. Docker 环境配置
5. 数据库服务启动
6. 环境变量配置
7. 数据库迁移执行
8. 种子数据生成
9. 服务状态验证

### 启动脚本流程
1. 环境配置文件检查
2. 依赖安装验证
3. 数据库连接测试
4. 端口占用检查
5. 开发服务器启动
6. 服务状态等待
7. 健康检查验证
8. 实时日志显示

## 高级配置

### 自定义端口
编辑 `apps/backend/.env` 文件：
```
PORT=3001  # 修改为其他端口
```

### 环境变量配置
`.env` 文件包含所有重要的配置选项：
- 数据库连接信息
- Redis 配置
- JWT 密钥设置
- 文件上传配置

### 日志级别调整
在 `.env` 文件中设置：
```
LOG_LEVEL=debug  # 可选: error, warn, info, debug
```

## 故障排除

### 查看服务日志
```bash
docker-compose logs postgres
docker-compose logs redis
```

### 重新生成数据
```bash
cd apps/backend
pnpm sequelize-cli db:migrate:undo:all
pnpm sequelize-cli db:migrate
pnpm exec tsx scripts/seed_data.ts
```

### 重置整个环境
```bash
docker-compose down -v
docker volume prune -f
# 然后重新运行初始化脚本
```

## 技术支持

如遇到脚本相关问题，请检查：
1. 操作系统兼容性
2. 依赖版本要求
3. 网络连接状态
4. 端口可用性
5. 磁盘空间

更多详细信息请参考项目文档：`docs/src/backend/后端项目初始化指南.md`