// IDP OIDC 契约
namespace js oidc

// 响应类型
enum OIDCResponseType {
  Code = 0
}

// 授权类型
enum OIDCGrantType {
  AuthorizationCode = 0,
  RefreshToken = 1
}

// 响应模式
enum OIDCResponseMode {
  Query = 0
}

// 令牌端点认证方式
enum OIDCTokenAuthMethod {
  None = 0
}

// PKCE 方法
enum OIDCPKCEMethod {
  S256 = 0
}

// ID Token 签名算法
enum OIDCSigningAlg {
  Rs256 = 0
}

// Scope 枚举
enum OIDCScope {
  Openid = 0,
  Profile = 1,
  Email = 2
}

// Claim 枚举
enum OIDCClaim {
  Sub = 0,
  Name = 1,
  PreferredUsername = 2,
  Email = 3,
  Acr = 4,
  Amr = 5,
  Nonce = 6
}

// 发现配置（Well‑Known）
struct Configuration {
  1: string issuer,                               // 发行者（IdP 基础 URL）
  2: string authorization_endpoint,               // 授权端点
  3: string token_endpoint,                       // 令牌端点
  4: string userinfo_endpoint,                    // 用户信息端点
  5: string jwks_uri,                             // 公钥集合地址
  6: list<OIDCResponseType> response_types_supported,       // 支持的响应类型
  7: list<OIDCGrantType> grant_types_supported,             // 支持的授权类型
  8: list<OIDCResponseMode> response_modes_supported,       // 支持的响应模式
  9: list<OIDCTokenAuthMethod> token_endpoint_auth_methods_supported, // 令牌端点认证方式
  10: list<OIDCPKCEMethod> code_challenge_methods_supported,          // 支持的 PKCE 方法
  11: list<OIDCSigningAlg> id_token_signing_alg_values_supported,     // 支持的 ID Token 签名算法
  12: list<OIDCScope> scopes_supported,                                // 支持的 scopes
  13: list<OIDCClaim> claims_supported                                 // 支持的 claims
}

// 授权请求（支持 PKCE）
struct AuthorizationRequest {
  1: string client_id,         // 客户端 ID
  2: string redirect_uri,      // 回调地址（需在白名单中）
  3: OIDCResponseType response_type, // 响应类型
  4: list<OIDCScope> scope,    // 请求的 scopes
  5: string state,             // 授权会话标识
  6: string code_challenge,    // PKCE 挑战
  7: OIDCPKCEMethod code_challenge_method // PKCE 方法
}

// 授权请求创建结果
struct AuthorizationInitResult {
  1: bool ok,    // 是否创建成功
  2: string state, // 授权会话标识
  3: optional string ticket // 临时票据，用于换取请求详情
}

// 授权请求详情（用于登录页展示）
struct AuthorizationRequestInfo {
  1: string client_id,       // 客户端 ID
  2: string client_name,     // 客户端名称（用于展示）
  3: list<OIDCScope> scope,  // 申请的权限列表
  4: string redirect_uri,    // 授权后的回调地址
  5: string state            // 客户端传递的状态值
}

// 令牌请求
struct TokenRequest {
  1: OIDCGrantType grant_type, // 授权类型
  2: string code,          // 授权码（当为 authorization_code）
  3: string redirect_uri,  // 回调地址（需与授权一致）
  4: string client_id,     // 客户端 ID
  5: string code_verifier  // PKCE 校验值（当为 authorization_code）
}

// 令牌响应
struct TokenResponse {
  1: string access_token,          // 访问令牌
  2: string id_token,              // ID 令牌
  3: optional string refresh_token,// 刷新令牌（可选）
  4: i32 expires_in,               // 访问令牌过期时间（秒）
  5: string token_type             // 令牌类型（bearer）
}

// JWK（公钥）
struct JWK {
  1: string kty,      // 密钥类型（RSA）
  2: string kid,      // 密钥标识
  3: string keyUse,   // 用途（sig）
  4: string n,        // 模数（base64url）
  5: string e,        // 指数（base64url）
  6: string alg       // 算法（RS256）
}

// 公钥集合
struct JWKSet {
  1: list<JWK> keys // 公钥列表
}

// 用户信息
struct UserInfo {
  1: string sub,                       // 主体标识（用户 ID 或哈希）
  2: optional string name,             // 姓名（需要 scope:profile）
  3: optional string preferred_username, // 首选用户名
  4: optional string email,            // 邮箱（需要 scope:email）
  5: optional string phone,            // 电话（可选）
  6: optional string acr,              // 认证上下文（如 mfa）
  7: optional list<string> amr,        // 认证方法（如 ['sms']）
  8: optional list<string> roles       // 用户角色列表
}

// 撤销结果
struct RevocationResult {
  1: bool ok // 是否成功
}

// 客户端信息
struct ClientInfo {
  1: string client_id,                 // 客户端 ID
  2: string name,                      // 客户端名称
  3: optional string default_redirect_uri, // 默认回调地址
  4: optional list<OIDCScope> scopes   // 支持的 scopes
}

service oidc {
  AuthorizationInitResult authorize(1: AuthorizationRequest req), // 发起授权请求
  TokenResponse token(1: TokenRequest req),                       // 令牌交换/刷新
  JWKSet jwks(),                                                  // 获取公钥集合
  UserInfo userinfo(1: string access_token),                      // 查询用户信息
  RevocationResult revocation(1: string token),                   // 撤销刷新令牌
  RevocationResult backchannel_logout(1: string logout_token),    // 后通道登出
  list<ClientInfo> clients(),                                     // 列出客户端
  Configuration configuration(),                                   // 发现配置
  AuthorizationRequestInfo getAuthorizationRequest(1: string ticket) // 获取授权请求详情
}
