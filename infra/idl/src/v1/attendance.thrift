// 考勤领域类型
namespace js attendance
include "./common.thrift"
include "./base.thrift"

// 考勤状态枚举
enum AttendanceStatus {
  Normal = 1,      // 正常出勤
  Late = 2,        // 迟到
  Absent = 3,      // 缺勤
  Leave = 4,       // 请假
  NotChecked = 5   // 未打卡
}

// 考勤任务基础信息
struct AttendanceTaskBase {
  1: i32 classId,              // 班级ID（外键）
  2: string taskName,          // 任务名称
  3: string taskType,          // 任务类型
  4: base.Timestamp startTime, // 开始时间
  5: base.Timestamp endTime,   // 结束时间
  6: common.Status status      // 状态
}

// 考勤任务完整信息
struct AttendanceTask {
  1: i32 id,                    // 任务唯一标识符
  2: AttendanceTaskBase base,   // 基础信息
  3: base.Timestamp createdAt,  // 创建时间
  4: base.Timestamp updatedAt   // 更新时间
}

// 创建考勤任务输入
struct CreateAttendanceTaskInput {
  1: i32 classId,
  2: string taskName,
  3: string taskType,
  4: base.Timestamp startTime,
  5: base.Timestamp endTime,
  6: common.Status status
}

// 更新考勤任务输入（允许部分字段可选）
struct UpdateAttendanceTaskInput {
  1: optional string taskName,
  2: optional string taskType,
  3: optional base.Timestamp startTime,
  4: optional base.Timestamp endTime,
  5: optional common.Status status
}

// 考勤记录基础信息
struct AttendanceRecordBase {
  1: i32 attendanceTaskId, // 考勤任务ID（外键）
  2: i32 userId,           // 用户ID（外键）
  3: AttendanceStatus status, // 考勤状态
  4: string remark         // 备注
}

// 考勤记录完整信息
struct AttendanceRecord {
  1: i32 id,                     // 记录唯一标识符
  2: AttendanceRecordBase base,  // 基础信息
  3: base.Timestamp createdAt,   // 创建时间
  4: base.Timestamp updatedAt    // 更新时间
}

// 创建考勤记录输入
struct CreateAttendanceRecordInput {
  1: i32 attendanceTaskId,
  2: i32 userId,
  3: AttendanceStatus status,
  4: string remark
}

// 更新考勤记录输入
struct UpdateAttendanceRecordInput {
  1: optional AttendanceStatus status,
  2: optional string remark
}

// 考勤详情
struct AttendanceDetail {
  1: i32 id,
  2: i32 recordId,
  3: string ipAddress,
  4: string deviceInfo,
  5: optional string location
}

// 学生打卡参数
struct CheckinParams {
  1: i32 classId
}

// 考勤统计信息
struct AttendanceStat {
  1: i32 totalCount,
  2: i32 normalCount,
  3: i32 lateCount,
  4: i32 absentCount,
  5: i32 leaveCount,
  6: double rate
}

// 学生考勤统计
struct StudentAttendanceStat {
  1: AttendanceStat stat, // 汇总统计
  2: i32 studentId,
  3: string studentName
}

// 兼容旧接口：Attendance = AttendanceRecord
typedef AttendanceRecord Attendance
