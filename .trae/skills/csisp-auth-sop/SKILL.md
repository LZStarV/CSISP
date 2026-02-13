---
name: 'csisp-auth-sop'
description: 'CSISP 身份认证与鉴权接入 SOP。在需要为新服务接入登录流程、集成鉴权 SDK 或排查 OIDC 相关问题时调用。'
---

# CSISP 身份认证接入 SOP

本技能用于指导开发者在 CSISP 体系内集成统一身份认证系统（IDP）。

## 适用场景

- 为新的子应用接入登录功能
- 在 react 前端使用 `@csisp/auth/react` 进行状态管理与路由保护
- 在后端使用 `@csisp/auth/server` 进行请求拦截与令牌验证
- 排查 OIDC 流程中的 404、PKCE 校验失败等常见问题

## 核心原则

1. **IDL-First**: 必须先在 `infra/idl` 中确保 `idp.thrift` 定义完整，并执行 `pnpm idl:gen`。
2. **Domain 统一**: 后端鉴权相关路由必须归属于 `oidc` domain（如 `/api/:sub-app/oidc/authorize`）。
3. **安全先行**: 强制使用 PKCE 流程，`code_verifier` 必须存储在 HttpOnly Cookie 中。

## 执行步骤

### 1. 基础设施准备

- 确保 `infra/idl/idp.thrift` 已定义核心接口：`authorize`, `token`, `userinfo`, `revocation`。
- 检查 `@csisp/auth` 依赖是否已安装在目标项目中。

### 2. 后端集成 (BFF/Server)

- **控制器映射**: 在后端模块（如 `auth.module.ts`）中将 `oidc` 域映射到对应的控制器方法。
- **IdpClient 初始化**: 使用 `@csisp/auth/server` 中的 `IdpClient` 对接 IDP Thrift 服务。
- **回调处理**: 实现 `/api/auth/callback` 路由，处理 `code` 换取 `token` 的逻辑。
- **中间件配置**: 引入 `koaAuth` 或 `AuthGuard`（NestJS）保护业务接口。

### 3. 前端集成 (React)

- **Provider 配置**: 在根布局包裹 `AuthProvider`，配置 `clientId` 和 `apiPrefix`。
- **路由保护**: 使用 `AuthGuard` 包裹私有路由（如 `(admin)/layout.tsx`）。
- **状态使用**: 使用 `useAuth()` 钩子获取用户信息和 `logout` 方法。

## 常见问题排查 (Troubleshooting)

- **Missing code or verifier**:
  - 检查 `authorize` 阶段是否将 `code_verifier` 传给 BFF。
  - 检查 BFF 是否将其正确写入了 `OIDC_VERIFIER_COOKIE`。
- **Unauthorized (401)**: 检查 `Authorization: Bearer <token>` 是否在 Header 中正确携带。

## 参考资源

- 文档：[身份认证与鉴权](/src/基础设施与基建/身份认证与鉴权)
- 示例代码：`apps/backoffice/src/server/modules/auth/`
