# Infisical 开发者接入指南

本项目使用 Infisical 进行 Secrets（环境变量）的统一管理。当前已支持连接远端云服务器上的 Infisical 实例进行开发，建议统一使用远端，避免本地依赖。

## 1. 开发前准备

### 安装 CLI

开发者需在本地安装 Infisical 命令行工具，以便将 Secrets 注入项目进程。

```bash
pnpm add -wD @infisical/cli
```

### 连接远端 Secrets 服务

团队已将 Infisical 部署到云服务器（例如 http://43.139.43.214:80）。运行脚本时会在开头自动触发登录，无需手动执行 login。

## 2. 日常开发

### 运行项目

根目录下的所有 `dev:*` 脚本已集成 `infisical run`。在已登录远端的前提下，像平时一样运行即可：

```bash
pnpm dev:infra
pnpm dev:idp:server
```

### 查看/导出变量

如果你需要查看当前环境生效的所有变量，可以运行：

```bash
pnpm exec infisical export --domain http://43.139.43.214/api
```

## 3. 注意事项

- **关于 `.infisical.json`**: 请勿将其从 Git 中删除，它用于帮助团队成员自动关联项目。
- **关于敏感操作**: 如果你在 Web UI 修改了变量，下次启动项目时 CLI 会自动获取最新值，无需手动同步。
