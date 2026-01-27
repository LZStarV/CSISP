// IDP OIDC 契约
// - authorize：授权码 + PKCE 请求
// - token：令牌交换
// - jwks：公钥集合
// - userinfo：用户信息
namespace js oidc
struct AuthorizationRequest {
  1: string client_id,
  2: string redirect_uri,
  3: string response_type,
  4: string scope,
  5: string state,
  6: string code_challenge,
  7: string code_challenge_method
}
struct AuthorizationCode {
  1: string code,
  2: string redirect_uri
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
  3: optional string email,
  4: optional string phone
}
service OIDCService {
  AuthorizationCode authorize(1: AuthorizationRequest req),
  TokenResponse token(1: TokenRequest req),
  JWKSet jwks(),
  UserInfo userinfo(1: string access_token)
}
