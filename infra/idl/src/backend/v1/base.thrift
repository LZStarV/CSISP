// 基础领域类型定义（跨领域通用）
namespace js base
include "./common.thrift"

// 学期枚举（第几学期）
enum Semester {
  First = 1,
  Second = 2,
  Third = 3,
  Fourth = 4,
  Fifth = 5,
  Sixth = 6,
  Seventh = 7,
  Eighth = 8
}

// 星期枚举（1-7）
enum WeekDay {
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
  Sunday = 7
}

// 时间戳（毫秒）
typedef i64 Timestamp

// 专业列表
typedef list<string> MajorList

// 用户角色类型
enum UserRole {
  Student = 1, // 学生
  Teacher = 2, // 教师
  Admin = 3    // 管理员
}

// 通用分页参数
struct PaginationParams {
  1: i32 page, // 页码
  2: i32 size  // 每页条数
}

// 通用分页响应元信息（不包含数据本体）
struct PaginationInfo {
  1: i32 total,      // 总记录数
  2: i32 page,       // 当前页码
  3: i32 size,       // 当前每页条数
  4: i32 totalPages  // 总页数
}

// 时间段（可用于课程时间安排等）
struct TimeRange {
  1: string startTime, // 开始时间（ISO 字符串）
  2: string endTime    // 结束时间（ISO 字符串）
}

// 通用响应结构（data 使用字符串承载，具体结构由业务自定义）
struct ApiResponse {
  1: i32 code,            // 业务码
  2: string message,      // 描述
  3: optional string data // 可选：数据（JSON 字符串）
}
