// IDP OIDC 契约
// - authorize：授权码 + PKCE 请求
// - token：令牌交换
// - jwks：公钥集合
// - userinfo：用户信息
namespace js oidc
struct Configuration {
  1: string issuer,
  2: string authorization_endpoint,
  3: string token_endpoint,
  4: string userinfo_endpoint,
  5: string jwks_uri,
  6: list<string> response_types_supported,
  7: list<string> grant_types_supported,
  8: list<string> response_modes_supported,
  9: list<string> token_endpoint_auth_methods_supported,
  10: list<string> code_challenge_methods_supported,
  11: list<string> id_token_signing_alg_values_supported,
  12: list<string> scopes_supported,
  13: list<string> claims_supported
}
struct AuthorizationRequest {
  1: string client_id,
  2: string redirect_uri,
  3: string response_type,
  4: string scope,
  5: string state,
  6: string code_challenge,
  7: string code_challenge_method
}
struct AuthorizationInitResult {
  1: bool ok,
  2: string state
}
struct TokenRequest {
  1: string grant_type,
  2: string code,
  3: string redirect_uri,
  4: string client_id,
  5: string code_verifier
}
struct TokenResponse {
  1: string access_token,
  2: string id_token,
  3: optional string refresh_token,
  4: i32 expires_in,
  5: string token_type
}
struct JWK {
  1: string kty,
  2: string kid,
  3: string use,
  4: string n,
  5: string e,
  6: string alg
}
struct JWKSet {
  1: list<JWK> keys
}
struct UserInfo {
  1: string sub,
  2: optional string name,
  3: optional string preferred_username,
  4: optional string email,
  5: optional string phone,
  6: optional string acr,
  7: optional list<string> amr
}
struct RevocationResult {
  1: bool ok
}
struct ClientInfo {
  1: string client_id,
  2: string name,
  3: optional string default_redirect_uri,
  4: optional list<string> scopes
}
service OIDCService {
  AuthorizationInitResult authorize(1: AuthorizationRequest req),
  TokenResponse token(1: TokenRequest req),
  JWKSet jwks(),
  UserInfo userinfo(1: string access_token),
  RevocationResult revocation(1: string token),
  RevocationResult backchannel_logout(1: string logout_token),
  list<ClientInfo> clients(),
  Configuration configuration()
}
