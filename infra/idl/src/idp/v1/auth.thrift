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
  2: optional string name // 用户名称（显示名/用户名）
  3: optional string student_id // 学号
}

// 忘记密码：多因子验证方法不可用原因
enum RecoveryUnavailableReason {
  NotBoundPhone = 0,   // 未绑定手机号
  NotBoundEmail = 1,   // 未绑定邮箱
  MethodDisabled = 2,  // 该方式未启用
  NotImplemented = 3,  // 该方式暂未实现
  PolicyDenied = 4     // 策略不允许使用该方式
}

// 忘记密码：可用方法列表项
struct RecoveryMethod {
  1: common.MFAType type,                 // 方法类型
  2: bool enabled,                        // 是否可用
  3: optional string extra,               // 额外信息（如手机号/邮箱）
  4: optional RecoveryUnavailableReason reason // 不可用原因（可用则不返回）
}

// 忘记密码：初始化结果
struct RecoveryInitResult {
  1: string student_id,             // 学号
  2: optional string name,          // 名称
  3: list<RecoveryMethod> methods   // 可选方法列表
}

// 忘记密码：验证码校验结果
struct VerifyResult {
  1: bool ok,                       // 是否校验通过
  2: optional string reset_token    // 重置令牌（一次性、短期）
}

service auth {
  RSATokenResult rsatoken(), // 获取 RSA 公钥与一次性标识
  LoginResult login(1: string studentId, 2: string password), // 账号密码登录
  common.Next multifactor(1: common.MFAType type, 2: string codeOrAssertion, 3: string phoneOrEmail), // 多因子挑战/校验（短信等）
  RecoveryInitResult forgot_init(1: string studentId), // 忘记密码初始化：返回可用方法与不可用原因
  common.Next forgot_challenge(1: common.MFAType type, 2: string studentId), // 忘记密码：触发验证码
  VerifyResult forgot_verify(1: common.MFAType type, 2: string studentId, 3: string code), // 忘记密码：校验验证码并下发重置令牌
  common.Next reset_password(1: string studentId, 2: string newPassword, 3: ResetReason reason, 4: string resetToken), // 使用令牌重置密码
  common.Next enter(1: string state, 2: optional string redirectMode), // 完成登录并进行授权回调
  MfaMethodsResult mfa_methods(), // 查询当前会话可用的多因子方法
  SessionResult session() // 查询会话登录状态
}
