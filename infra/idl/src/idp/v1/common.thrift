// IDP 通用类型

namespace js common

// 登录状态机步骤
enum AuthNextStep {
  Multifactor = 0,    // 进入多因子校验
  ResetPassword = 1,  // 进入重置密码
  Enter = 2,          // 完成登录进入授权阶段
  Finish = 3          // 结束流程
}

// 多因子类型
enum MFAType {
  Sms = 0,   // 短信
  Email = 1, // 邮件
  Fido2 = 2, // 安全密钥（FIDO2）
  Otp = 3    // 一次性验证码（TOTP）
}

// 多因子方法描述
struct Method {
  1: MFAType type,        // 方法类型
  2: bool enabled,        // 是否启用
  3: optional string extra // 额外信息（如手机号/邮箱/注册信息）
}

// 短信发送结果
struct SmsSendResult {
  1: string code,                      // 验证码或发送结果编码
  2: bool success,                     // 是否发送成功
  3: optional string message,          // 结果消息
  4: optional string request_id,       // 平台请求 ID
  5: optional string access_denied_detail // 拒绝原因详情
}

// 状态机下一步
struct Next {
  1: list<AuthNextStep> next,     // 下一步指令列表（枚举）
  2: optional SmsSendResult sms,  // 短信发送结果（当下一步仍是 multifactor 时返回）
  3: optional string redirectTo   // 授权跳转地址（当 next=finish 时可返回）
}

// 重置密码原因标识
struct ResetPasswordFlags {
  1: bool forget_password, // 是否因忘记密码触发
  2: bool weak_password    // 是否因弱口令触发
}

/**
 * 敏感字段列表，用于日志脱敏
 * 对齐 IDL 定义中的凭据、令牌、验证码等字段
 */
const list<string> SENSITIVE_FIELDS = [
  "password",
  "newPassword",
  "oldPassword",
  "code",
  "codeOrAssertion",
  "token",
  "accessToken",
  "refreshToken",
  "access_token",
  "refresh_token",
  "id_token",
  "logout_token",
  "resetToken",
  "reset_token",
  "ticket",
  "code_verifier",
  "private_pem",
  "private_pem_enc"
]
