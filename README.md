# 计算机学院综合服务平台(CSISP)

## 快速开始

### 安装依赖

```bash
pnpm i

# 也可以只安装一个子项目的依赖
pnpm --filter [sub-application-name] i
```

### 运行子项目

```bash
pnpm --filter [sub-application-name] dev
```

### 构建子项目

```bash
pnpm --filter [sub-application-name] build
```

## 文档

文档位于 `docs/`，入口为 `docs/index.md`。本地预览与构建：

```bash
pnpm -C docs dev
pnpm -C docs build
```

## 贡献

- 分支与提交：遵循 Conventional Commits；功能在 feature 分支完成并发起 PR，关联 Issue。
- 代码质量：PR 必须通过类型检查、lint 与基础测试；保持一致的编码风格与目录结构。
- 文档与脚本：涉及接口、数据库或部署流程的改动须同步更新 `docs/` 与相关脚本。
- 数据库演进：所有 Schema 变更通过 `packages/db-schema` 的迁移脚本管理；禁止直接手改生产库结构。
- 安全与合规：严禁提交密钥、凭证等敏感信息；使用 CI/CD 平台的 Secrets 管理连接与令牌。
