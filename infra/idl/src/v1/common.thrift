// 通用领域类型定义（供各服务复用）
namespace js common

// 通用资源唯一标识，字符串形式（如用户、课程等主键）
typedef string UUID

// 资源状态枚举
enum Status {
  Active = 1,   // 可用/启用
  Inactive = 2  // 不可用/停用
}

// 分页请求参数
struct Pagination {
  1: i32 page = 1,       // 页码（从 1 开始）
  2: i32 pageSize = 20   // 每页条数
}

// 分页响应元信息
struct PageMeta {
  1: i32 page,       // 当前页码
  2: i32 pageSize,   // 当前每页条数
  3: i32 total       // 总记录数
}

// 统一异常结构，用于 service throws
exception ApiException {
  1: i32 code,               // 业务错误码
  2: string message,         // 错误信息
  3: optional string details // 可选：错误详细描述
}
