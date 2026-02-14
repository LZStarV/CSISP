# Infisical 开发者接入指南

本项目使用 Infisical 进行 Secrets（环境变量）的统一管理。在 Infisical 服务完全上云前，我们需要连接本地运行的 Infisical 实例进行开发。

## 1. 开发前准备

### 安装 CLI

开发者需在本地安装 Infisical 命令行工具，以便将 Secrets 注入项目进程。

```bash
pnpm add -wD @infisical/cli
```

### 启动私有 Secrets 服务

如果本地尚未启动 Infisical 服务，请先启动（需确保已安装 Docker）：

```bash
cd infra/infisical
pnpm run up
```

_注：服务启动后运行在 http://localhost:8080_

## 2. 身份认证与项目关联

### 登录本地实例

由于我们使用的是私有部署，登录时必须指定 `--domain`：

```bash
pnpm exec infisical login --domain http://localhost:8080
```

### 项目关联 (首次接入需执行)

如果你是第一次在该仓库使用，或者 `.infisical.json` 丢失，请运行：

```bash
pnpm exec infisical init
```

- **Organization**: 选择默认组织。
- **Project**: 选择 `CSISP`。
- **Environment**: 选择 `dev`。

## 3. 日常开发

### 运行项目

根目录下的所有 `dev:*` 脚本已集成 `infisical run`。你只需要像平时一样运行即可：

```bash
pnpm dev:infra
pnpm dev:idp:server
```

CLI 会自动从本地 Infisical 服务抓取变量并注入到 Node.js 的 `process.env` 中。

### 查看/导出变量

如果你需要查看当前环境生效的所有变量，可以运行：

```bash
pnpm exec infisical export
```

## 4. 注意事项

- **关于 `.infisical.json`**: 请勿将其从 Git 中删除，它用于帮助团队成员自动关联项目。
- **关于敏感操作**: 如果你在 Web UI 修改了变量，下次启动项目时 CLI 会自动获取最新值，无需手动同步。
