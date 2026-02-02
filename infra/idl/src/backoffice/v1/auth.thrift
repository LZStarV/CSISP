// Backoffice Auth 服务定义
// - login：使用用户名与密码获取令牌或会话标识
// - me：获取当前登录用户的基本信息（用户名、角色）

namespace js auth
include "user.thrift"
service auth {
  string login(1: string username, 2: string password),
  user.UserInfo me()
}
