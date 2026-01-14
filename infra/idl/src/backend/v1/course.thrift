// 课程领域类型与关系
namespace js course
include "./common.thrift"
include "./base.thrift"

// 课程基础信息
struct CourseBase {
  1: string courseName,        // 课程名称
  2: string courseCode,        // 课程代码
  3: base.Semester semester,   // 学期
  4: i32 academicYear,         // 学年
  5: base.MajorList availableMajors, // 可选择的专业列表
  6: common.Status status      // 状态
}

// 课程完整信息
struct Course {
  1: i32 id,                    // 课程唯一标识符
  2: CourseBase base,           // 基础信息
  3: base.Timestamp createdAt,  // 创建时间
  4: base.Timestamp updatedAt,  // 更新时间
  5: optional list<Teacher> teachers,  // 教师集合
  6: optional list<TimeSlot> timeSlots,// 时间段集合
  7: optional list<Class> classes      // 班级集合
}

// 教师信息
struct Teacher {
  1: i32 id,                 // 教师唯一标识符
  2: i32 userId,             // 关联用户ID（外键）
  3: string teacherId,       // 教师工号（唯一，11位字符串）
  4: string realName,        // 真实姓名
  5: string email,           // 邮箱（唯一）
  6: string phone,           // 手机号（唯一）
  7: string department,      // 所属部门
  8: string title,           // 职称
  9: common.Status status,   // 状态
  10: base.Timestamp createdAt, // 创建时间
  11: base.Timestamp updatedAt  // 更新时间
}

// 课程-教师关联
struct CourseTeacher {
  1: i32 courseId,
  2: i32 teacherId
}

// 时间段模型
struct TimeSlot {
  1: i32 id,                // 时间段唯一标识符
  2: i32 subCourseId,       // 所属子课程ID（外键）
  3: i32 weekday,           // 星期几（1-7）
  4: string startTime,      // 开始时间
  5: string endTime,        // 结束时间
  6: string location,       // 上课地点
  7: common.Status status,  // 状态
  8: base.Timestamp createdAt, // 创建时间
  9: base.Timestamp updatedAt  // 更新时间
}

// 子课程模型
struct SubCourse {
  1: i32 id,                  // 子课程唯一标识符
  2: i32 courseId,            // 所属课程ID（外键）
  3: string subCourseCode,    // 子课程标识
  4: i32 teacherId,           // 授课教师ID（外键）
  5: i32 academicYear,        // 学年
  6: common.Status status,    // 状态
  7: base.Timestamp createdAt,// 创建时间
  8: base.Timestamp updatedAt // 更新时间
}

// 班级信息
struct Class {
  1: i32 id,                     // 班级唯一标识符
  2: string className,           // 班级名称
  3: i32 courseId,               // 所属课程ID（外键）
  4: i32 teacherId,              // 授课教师ID（外键）
  5: base.Semester semester,     // 学期
  6: i32 academicYear,           // 学年
  7: i32 maxStudents,            // 最大学生数（默认50）
  8: common.Status status,       // 状态
  9: base.Timestamp createdAt,   // 创建时间
  10: base.Timestamp updatedAt   // 更新时间
}

// 用户-班级关联
struct UserClass {
  1: i32 id,                // 关联唯一标识符
  2: i32 userId,            // 用户ID（外键，级联删除）
  3: i32 classId,           // 班级ID（外键，级联删除）
  4: base.Timestamp joinTime, // 加入时间
  5: common.Status status   // 状态
}

// 学期配置
struct SemesterConfig {
  1: i32 id,
  2: string year,
  3: i32 semester,           // 1 或 2
  4: base.Timestamp startDate,
  5: base.Timestamp endDate,
  6: bool isCurrent,
  7: common.Status status
}
