// 种子数据与初始化相关类型
namespace js seed
include "./course.thrift"

// 课程数据项
struct CourseDataItem {
  1: string course_name,
  2: string course_code,
  3: i32 semester,
  4: list<string> available_majors
}

// 教师数据项（基于 course.Teacher，去除 id/status 并补充字段）
struct TeacherDataItem {
  1: i32 userId,
  2: string teacherId,
  3: string realName,
  4: string email,
  5: string phone,
  6: string department,
  7: string title
}

// 用户创建属性
struct UserCreationAttributes {
  1: string username,
  2: string password,
  3: string realName,
  4: string studentId,
  5: i32 enrollmentYear,
  6: string major,
  7: optional i32 status,
  8: optional string email,
  9: optional string phone
}

// 角色创建属性
struct RoleCreationAttributes {
  1: string name,
  2: string description,
  3: optional i32 status
}

// 课程教师关联属性
struct CourseTeacherAttributes {
  1: i32 courseId,
  2: i32 teacherId
}

// 用户角色关联属性
struct UserRoleAttributes {
  1: i32 userId,
  2: i32 roleId
}

// 用户班级关联属性
struct UserClassAttributes {
  1: i32 userId,
  2: i32 classId
}
