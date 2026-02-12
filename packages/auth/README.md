# @csisp/auth

CSISP 统一身份认证 SDK，集成了 OIDC 协议、PKCE 安全流程、JWT 处理及会话管理能力。

## 目录结构

- `browser/`: 浏览器端工具，主要用于登录流程初始化。
- `server/`: 服务端工具，包含 IDP 客户端、Session 管理、鉴权中间件辅助等。
- `common/`: 前后端通用的常量、枚举定义。

---

## 浏览器端工具 (`@csisp/auth/browser`)

用于在前端初始化 OIDC 登录流程，生成必要的安全参数。

### `generatePKCE()`

生成 PKCE (Proof Key for Code Exchange) 参数。

- **返回**: `{ verifier: string, challenge: string }`
- **用途**: `challenge` 用于传递给 IDP，`verifier` 需存在本地并在回调时发给后端。

### `generateState()`

生成随机的 `state` 字符串。

- **用途**: 防止 CSRF 攻击，确保回调请求是由本系统发起的。

---

## 服务端工具 (`@csisp/auth/server`)

### `IdpClient`

封装了与 IDP (Identity Provider) 通信的 Thrift RPC 客户端。

#### `getAuthorizationUrl(params, ctx)`

快速获取授权跳转地址。

- **参数**: `state`, `code_challenge`, `client_id`, `redirect_uri` 等。
- **作用**: 自动构造符合 OIDC 规范的请求并返回 IDP 的跳转目标。

#### `exchangeAndDecodeUser(params, ctx)`

一站式完成 Token 换取与用户信息解析。

- **作用**: 内部调用 `token` 接口换取令牌，并自动验证/解码 `id_token`，返回标准化的 `IUserInfo` 对象。

### `SessionManager`

通用的会话管理器，支持可插拔的存储引擎。

- **`create(token, user, ttlMs)`**: 创建会话。
- **`get(token)`**: 获取会话数据。
- **`destroy(token)`**: 销毁会话。

#### `MemorySessionStore`

SDK 内置的内存存储实现，适用于开发环境或无 Redis 场景。

### `verifyAuth(token, options)`

全能型鉴权校验函数。

- **作用**:
  1. 校验 JWT 令牌的合法性与签名。
  2. (可选) 校验会话在后端存储中是否依然有效（支持主动踢人/注销）。
- **返回**: 解码后的用户信息对象或 `null`。

### JWT 工具

- **`signToken(payload, secret, options)`**: 签发令牌。
- **`verifyToken(token, secret)`**: 校验并获取 Payload。
- **`decodeToken(token)`**: 仅解码不校验（常用于从 ID Token 提取信息）。

---

## 通用常量 (`@csisp/auth/common`)

SDK 定义了一系列标准化的 Cookie 名称和配置：

- `AUTH_COOKIE_NAME`: 本地会话 Token 的 Cookie 名称 (`token`)。
- `OIDC_STATE_COOKIE`: 存储 OIDC State 的 Cookie 名称 (`oidc_state`)。
- `OIDC_VERIFIER_COOKIE`: 存储 PKCE Verifier 的 Cookie 名称 (`oidc_verifier`)。
- `DEFAULT_SESSION_TTL`: 默认会话过期时间（2 小时）。

---

## 使用示例 (Next.js Callback 路由)

```typescript
import { IdpClient } from '@csisp/auth/server';
import { OIDC_STATE_COOKIE, OIDC_VERIFIER_COOKIE } from '@csisp/auth/common';

const idpClient = new IdpClient({ url: '...' });

export async function GET(req: Request) {
  // 1. 获取参数与 Cookie
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const verifier = cookies().get(OIDC_VERIFIER_COOKIE)?.value;

  // 2. 换取用户信息 (SDK 封装逻辑)
  const { user, tokens } = await idpClient.exchangeAndDecodeUser({
    code,
    verifier,
    client_id: 'your-app',
    redirect_uri: '...',
  });

  // 3. 建立本地会话
  await sessionManager.create(tokens.access_token, user);
}
```
