// IDP Auth 服务定义

namespace js auth
include "./common.thrift"
enum ResetReason {
  ForgetPassword = 0, // 忘记密码
  WeakPassword = 1    // 弱口令
}

struct RSATokenResult {
  1: string publicKey,          // RSA 公钥（PEM）
  2: optional string token      // 短时一次性标识（便于前端关联）
}

struct LoginResult {
  1: list<common.AuthNextStep> next,            // 下一步指令列表（枚举：multifactor/reset_password/enter/finish）
  2: optional list<common.Method> multifactor,  // 可用的多因子方法集合
  3: optional common.ResetPasswordFlags reset_password // 重置密码原因标识
}

struct MfaMethodsResult {
  1: list<common.Method> multifactor // 当前会话下可用的多因子方法
}

struct SessionResult {
  1: bool logged // 是否已登录（存在有效会话）
}

service AuthService {
  RSATokenResult rsatoken(), // 获取 RSA 公钥与一次性标识
  LoginResult login(1: string studentId, 2: string password), // 账号密码登录
  common.Next multifactor(1: common.MFAType type, 2: string codeOrAssertion, 3: string phoneOrEmail), // 多因子挑战/校验（短信等）
  common.Next reset_password(1: string studentId, 2: string newPassword, 3: ResetReason reason), // 重置密码
  common.Next enter(1: string state, 2: optional string redirectMode), // 完成登录并进行授权回调
  MfaMethodsResult mfa_methods(), // 查询当前会话可用的多因子方法
  SessionResult session() // 查询会话登录状态
}
