// IDP 通用类型
// - MFAType：多因子类型
// - Method：多因子方法描述
// - Next：状态机下一步
// - ResetPasswordFlags：重置密码原因标识

namespace js common
enum MFAType {
  SMS,
  EMAIL,
  FIDO2,
  OTP
}
struct Method {
  1: MFAType type,
  2: bool enabled,
  3: optional string extra
}
struct SmsSendResult {
  1: string code,
  2: bool success,
  3: optional string message,
  4: optional string request_id,
  5: optional string access_denied_detail
}
struct Next {
  1: list<string> next,
  2: optional SmsSendResult sms
}
struct ResetPasswordFlags {
  1: bool forget_password,
  2: bool weak_password
}
