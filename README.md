# SCNU 计算机学院综合服务平台(CSISP)

> 本项目目前由 LZStarV 个人施工，并非真正已上线的官方平台代码仓库。

## 环境要求

- **Node.js**：遵循仓库根目录 `.nvmrc`，推荐使用 **24.x** 版本。
  - 推荐通过 `nvm` 管理 Node.js 版本，保持与项目脚本一致。
- **pnpm**：作为 monorepo 的包管理器，推荐版本 **10+**（与根 `package.json` 保持一致）。

## 快速开始

### 安装必要环境

```bash
# 切换 Node.js 版本为 24
nvm use 24

# 安装 infisical（环境变量管理）
npm i -g @infisical/cli
# npm 下载容易超时，可以改用 cnpm 进行下载也可以通过 Winget, Homebrew 等包管理器安装

# 安装 pnpm（版本＞=10）、turbo（monorepo 管理）、whistle（代理工具）
npm i -g pnpm turbo whistle
```

### 克隆仓库前的推荐 Git 配置（尤其是 Windows）

- 仓库统一使用 **LF (\n)** 作为换行符，由 EditorConfig、Prettier 和 ESLint 共同约束。
- Windows 环境下，建议在 **当前仓库根目录** 先执行（只影响本仓库）：

```bash
git config core.autocrlf input
git config core.eol lf
```

- 建议使用支持 EditorConfig 的编辑器，并确保保存时使用 LF：
  - 类 VS Code 编辑器：保持 EditorConfig 扩展启用，右下角换行符显示为 `LF`。

### 安装依赖

```bash
pnpm i

# 也可以只安装一个子项目的依赖
pnpm -F [sub-application-name] i
```

> 如果需要在开发环境中运行 Supabase 数据库，需要自行提前配置好 docker 环境，并在 infisical 中提前配置好 SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY 的 override 值。

### 运行子项目

首次运行或修改 workspace 依赖后，需要先构建项目：

```bash
# 构建所有 workspace 包（首次必需）
pnpm build

# 或只构建特定子项目及其依赖
turbo build --filter=@csisp/idp-client
```

然后可以在根 `package.json` 中运行子项目的开发脚本：

```bash
pnpm dev:idp:server
pnpm dev:idp:client
pnpm dev:bff
# ......
```

> 注意：
>
> - 在开发前需要检查是否已经执行过 `infisical login`，否则会有环境变量相关报错。
> - 如果遇到 `Cannot find module '@csisp/xxx'` 错误，说明 workspace 依赖未构建，请先执行 `pnpm build`。

### 代码格式化

- 仓库根目录提供全局格式化命令，仅在需要统一全仓库风格时使用：

```bash
pnpm format
# 日常开发推荐只对当前子项目执行格式化
pnpm -F [sub-application-name] format
```

### 构建项目

```bash
pnpm build
```

## 文档

文档位于 `docs/`，入口为 `docs/index.md`。本地预览与构建：

```bash
pnpm -F @csisp/docs dev
pnpm -F @csisp/docs build
```

## FAQ

### 1. Windows 下拉取仓库后，ESLint 提示换行符错误 / `pnpm format` 出现大量只改换行的 diff 怎么办？

- GitHub 仓库中的文件统一为 **LF 换行**。在 Windows 上如果开启了自动换行转换（如 `core.autocrlf=true`），本地工作区可能被透明地转换为 **CRLF**，但不会立刻在 `git status` 中显示差异。
- 之后运行 `pnpm format` 时，Prettier 会根据项目配置把文件改回 **LF**，这会让当前工作区相对于 Git 记录的“预期工作区内容”出现大量只改换行的 diff。

避免噪声提交的推荐处理方式：

1. **修正当前仓库的 Git 配置（只对本仓库生效）**：
   ```bash
   git config core.autocrlf input
   git config core.eol lf
   ```
2. **确保编辑器使用 LF 保存文件**：
   - VS Code：右下角将换行符切换为 `LF`，并保持 EditorConfig 配置生效。
3. **如果已经产生了大量“只改换行”的改动且尚未提交**：
   - 确认没有重要未保存的业务代码后，可以使用：

   ```bash
   git reset --hard HEAD
   ```

   - 然后在新的配置下重新运行必要的格式化命令（如仅对当前修改的文件执行，或依靠 `lint-staged`）。

4. **关于提交影响**：
   - 在这种场景下即使将这些 diff 提交到远端，GitHub 上文件的换行格式仍会保持为 LF，但会新增一次包含大量只改换行变更的提交，增加历史噪声，故不推荐在业务提交中混入这类全局换行修正。

## TODO (未来计划)

本项目处于持续演进中，部分代码正在经历重构。未来的大重构计划包括：

- 移除 `rpc` 子包，重新封装 HTTP 工具用于浏览器-BFF 调用
- 重构 `auth` 子包，专注 ESM 构建，为前端提供开箱即用的登录组件
- 提取 `utils` 中的 logger 为独立子包，支持日志审计扩展

完整的待办事项和技术细节请参阅 **[AGENTS.md](./AGENTS.md)**。
