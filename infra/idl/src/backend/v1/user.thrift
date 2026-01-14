// 用户领域类型与服务
namespace js user
include "./common.thrift"
include "./base.thrift"

// 用户实体
struct User {
  1: common.UUID id,     // 用户唯一 ID
  2: string name,        // 用户姓名
  3: string email,       // 邮箱（唯一）
  4: common.Status status, // 当前状态（Active/Inactive）
  5: optional i64 createdAt, // 创建时间（毫秒时间戳）
  6: optional i64 updatedAt  // 更新时间（毫秒时间戳）
}

// 创建用户请求参数
struct CreateUserInput {
  1: string name,   // 姓名
  2: string email   // 邮箱
}

// 列表响应
struct ListUsersResponse {
  1: list<User> items,   // 用户列表
  2: common.PageMeta meta // 分页元信息
}

// 用户服务定义
service UserService {
  // 根据用户 ID 获取详情
  User getUserById(1: common.UUID id) throws (1: common.ApiException e),
  // 创建用户
  User createUser(1: CreateUserInput input) throws (1: common.ApiException e),
  // 分页查询用户列表
  ListUsersResponse listUsers(1: common.Pagination page) throws (1: common.ApiException e)
}

// 用户基础信息（与业务侧 UserBase 对齐）
struct UserBase {
  1: string username,        // 用户名（唯一）
  2: string password,        // 密码（加密存储）
  3: string studentId,       // 学号（唯一，11位字符串）
  4: i32 enrollmentYear,     // 入学年份（范围：2000-3000）
  5: string major,           // 专业名称
  6: string realName,        // 真实姓名
  7: common.Status status    // 状态
}

// 用户完整信息（数值型主键 + 时间）
struct UserDetail {
  1: i32 id,                  // 用户唯一标识符（数值）
  2: UserBase base,           // 基础信息
  3: base.Timestamp createdAt,// 创建时间
  4: base.Timestamp updatedAt // 更新时间
}

// 登录参数
struct LoginParams {
  1: string username,
  2: string password
}

// 登录响应
struct LoginResponse {
  1: string token,                 // 认证 Token
  2: UserDetail user,              // 用户信息
  3: list<base.UserRole> roles     // 用户角色集合
}

// 角色信息
struct Role {
  1: i32 id,                 // 角色唯一标识符
  2: string name,            // 角色名称
  3: string code,            // 角色代码
  4: string description,     // 角色描述
  5: common.Status status,   // 状态
  6: base.Timestamp createdAt,// 创建时间
  7: base.Timestamp updatedAt // 更新时间
}

// 用户角色关联
struct UserRoleMap {
  1: i32 userId,
  2: i32 roleId
}

// 权限信息
struct Permission {
  1: i32 id,
  2: string name,
  3: string code,
  4: string description,
  5: common.Status status,
  6: base.Timestamp createdAt,
  7: base.Timestamp updatedAt
}

// 角色权限关联
struct RolePermission {
  1: i32 roleId,
  2: i32 permissionId
}

// 课代表信息
struct CourseRep {
  1: i32 id,                    // 课代表唯一标识符
  2: i32 userId,                // 学生用户ID（外键）
  3: i32 classId,               // 所属班级ID（外键）
  4: string responsibility,     // 职责描述
  5: base.Timestamp appointmentDate, // 任命日期
  6: common.Status status,      // 状态
  7: base.Timestamp createdAt,  // 创建时间
  8: base.Timestamp updatedAt   // 更新时间
}
