// Backoffice User 服务与模型
// - struct User：用户基本信息
// - struct UserInfo：用户角色等扩展信息
// - service user：用户查询与列表

namespace js user
struct UserRecord {
  1: i32 id,
  2: string username,
  3: i32 status
}
struct UserInfo {
  1: string username,
  2: list<string> roles
}
service user {
  UserRecord getUser(1: i32 id, 2: string username),
  list<UserRecord> listUsers(1: i32 page, 2: i32 size)
}
