// IDP Auth 服务定义
// - rsatoken：获取 RSA 公钥与一次性标识
// - login：账号密码登录，返回下一步与多因子列表
// - multifactor：多因子挑战/校验
// - reset_password：重置密码（忘记/弱口令）
// - enter：完成登录（进入授权码签发/回调）

namespace js auth
include "./common.thrift"
enum ResetReason {
  FORGET_PASSWORD,
  WEAK_PASSWORD
}
struct RSATokenResult {
  1: string publicKey,
  2: optional string token
}
struct LoginResult {
  1: list<string> next,
  2: optional list<common.Method> multifactor,
  3: optional common.ResetPasswordFlags reset_password
}
service AuthService {
  RSATokenResult rsatoken(),
  LoginResult login(1: string username, 2: string password),
  common.Next multifactor(1: common.MFAType type, 2: string codeOrAssertion, 3: string phoneOrEmail),
  common.Next reset_password(1: string newPassword, 2: ResetReason reason),
  common.Next enter()
}
