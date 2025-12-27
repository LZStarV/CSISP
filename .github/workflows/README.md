# 数据库容器部署工作流文档

## 1. 工作流概述

本工作流用于通过SSH协议在远程Linux服务器上自动部署PostgreSQL和Redis数据库容器。它支持多环境部署、自动版本控制和完整的错误处理机制。

## 2. 功能特性

### 核心功能
- ✅ 通过SSH协议安全连接至远程Linux服务器
- ✅ 自动部署PostgreSQL和Redis容器
- ✅ 支持多环境部署（development/staging/production）
- ✅ 容器拉取、配置、启动与状态验证
- ✅ 完整的错误捕获与日志记录

### 技术要点
- **SSH连接安全配置**：密钥管理与权限设置
- **远程命令执行可靠性**：错误处理与重试机制
- **Docker容器版本控制**：自动拉取最新镜像
- **冲突处理**：停止并移除旧容器，启动新容器
- **状态验证**：检查容器健康状态

## 3. 工作流触发条件

### 自动触发
- 代码推送到 `main` 分支 → 部署到 `production` 环境
- 代码推送到 `staging` 分支 → 部署到 `staging` 环境
- 代码推送到 `development` 分支 → 部署到 `development` 环境

### 手动触发
通过GitHub Actions界面手动触发，可选择部署环境和版本标签。

## 4. 配置要求

### 4.1 远程服务器要求
- Linux操作系统
- Docker和Docker Compose已安装
- 支持SSH连接

### 4.2 GitHub Secrets配置

在GitHub仓库的「Settings」→「Secrets and variables」→「Actions」中添加以下Secrets：

| Secret名称 | 描述 | 示例值 |
| --- | --- | --- |
| `SSH_HOST` | 远程服务器IP地址或域名 | `192.168.1.100` 或 `server.example.com` |
| `SSH_USER` | SSH用户名 | `deploy` |
| `SSH_PRIVATE_KEY` | SSH私钥 | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `SSH_PORT` (可选) | SSH端口 | `22` |
| `DB_PASSWORD` | 数据库密码 | `secure-password-123` |
| `REDIS_PASSWORD` (可选) | Redis密码 | `redis-password-456` |

### 4.3 GitHub Environments配置

建议为每个环境创建GitHub Environment，用于管理不同环境的配置：

1. **production** - 生产环境
2. **staging** - 预生产环境
3. **development** - 开发环境

## 5. 环境变量说明

| 环境变量 | 描述 | 默认值 |
| --- | --- | --- |
| `DOCKER_COMPOSE_FILE` | Docker Compose配置文件路径 | `infra/database/docker-compose.db.yml` |
| `PROJECT_ROOT` | 远程服务器上的项目根目录 | `csisp` |
| `DEPLOY_ENV` | 部署环境 | 自动根据分支或手动输入确定 |
| `ENV_FILE` | 环境变量文件 | `.env.<环境>.example` 或 `.env.example` |

## 6. 工作流执行流程

1. **检出代码**：从GitHub仓库检出最新代码
2. **设置部署环境**：根据触发条件确定部署环境
3. **安装SSH客户端**：在Runner上安装SSH客户端
4. **配置SSH连接**：设置SSH密钥和已知主机
5. **SSH部署**：
   - 连接到远程服务器
   - 创建项目目录
   - 创建/更新docker-compose.yml和.env文件
   - 停止并移除旧容器
   - 拉取最新镜像
   - 启动新容器
   - 等待容器健康检查通过
   - 验证容器状态
6. **部署后验证**：输出部署结果
7. **错误处理**：处理部署失败情况

## 7. 使用示例

### 7.1 自动部署

将代码推送到对应分支，工作流将自动触发：

```bash
# 推送代码到development分支，自动部署到development环境
git push origin development

# 推送代码到staging分支，自动部署到staging环境
git push origin staging

# 推送代码到main分支，自动部署到production环境
git push origin main
```

### 7.2 手动部署

1. 进入GitHub仓库的「Actions」标签页
2. 选择「数据库容器部署」工作流
3. 点击「Run workflow」按钮
4. 选择部署环境
5. （可选）输入版本标签
6. 点击「Run workflow」开始部署

## 8. 日志与监控

### 8.1 工作流日志

部署过程中的详细日志可在GitHub Actions工作流页面查看，包括：
- SSH连接日志
- Docker命令执行日志
- 容器启动日志
- 状态验证结果

### 8.2 远程服务器日志

在远程服务器上，可通过以下命令查看容器日志：

```bash
# 查看PostgreSQL容器日志
docker-compose logs -f postgres

# 查看Redis容器日志
docker-compose logs -f redis
```

## 9. 常见问题排查

### 9.1 SSH连接失败

**症状**：工作流日志显示SSH连接超时或拒绝连接

**解决方案**：
1. 检查 `SSH_HOST`、`SSH_USER`、`SSH_PORT` 是否正确
2. 验证 `SSH_PRIVATE_KEY` 是否有效
3. 确保远程服务器防火墙允许SSH连接
4. 检查远程服务器SSH服务是否运行

### 9.2 Docker容器启动失败

**症状**：容器启动后立即退出或健康检查失败

**解决方案**：
1. 查看容器日志：`docker-compose logs <container-name>`
2. 检查环境变量是否正确设置
3. 验证端口是否被占用
4. 确保卷挂载正常

### 9.3 权限问题

**症状**：Permission denied 错误

**解决方案**：
1. 确保SSH用户有权限执行Docker命令
2. 检查目录权限：`chown -R $USER:$USER $HOME/csisp`
3. 验证SSH密钥权限是否正确（600）

## 10. 工作流自定义

### 10.1 修改部署脚本

编辑 `.github/workflows/deploy-database.yml` 文件，可以自定义：

- 容器镜像版本
- 环境变量配置
- 部署流程步骤
- 健康检查参数

### 10.2 添加新的数据库服务

在 `docker-compose.yml` 模板中添加新的服务配置，例如MongoDB：

```yaml
mongodb:
  image: mongo:latest
  environment:
    MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER:-admin}
    MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD:-password}
  ports:
    - ${MONGO_PORT:-27017}:27017
  volumes:
    - mongo_data:/data/db
  healthcheck:
    test: ["CMD", "mongo", "--eval", "db.adminCommand('ping')"]
    interval: 30s
    timeout: 10s
    retries: 3
  restart: unless-stopped
```

## 11. 版本控制

### 11.1 容器版本管理

工作流使用固定的容器镜像版本，确保部署的一致性：
- PostgreSQL: `postgres:15`
- Redis: `redis:7-alpine`

### 11.2 工作流版本更新

当需要更新工作流时，建议：
1. 在测试环境验证新配置
2. 逐步推广到staging和production环境
3. 记录变更日志

## 12. 安全性考虑

### 12.1 SSH密钥管理
- 使用强密钥对，避免使用默认密钥
- 定期轮换SSH密钥
- 限制SSH用户权限

### 12.2 密码管理
- 所有密码通过GitHub Secrets管理
- 避免在代码中硬编码密码
- 定期更换密码

### 12.3 网络安全
- 限制SSH访问IP范围
- 考虑使用VPN或跳板机
- 定期检查服务器安全配置

## 13. 最佳实践

1. **多环境隔离**：使用不同的环境部署不同的分支
2. **定期备份**：设置数据库自动备份机制
3. **监控告警**：配置容器监控和告警
4. **文档更新**：及时更新工作流文档
5. **测试验证**：在部署前进行充分测试

## 14. 联系与支持

- **维护者**：技术团队
- **文档版本**：1.0.0
- **更新日期**：2025-12-25

---

**注意**：本工作流仅用于数据库容器部署，不包括应用程序部署。应用程序部署请参考其他工作流。