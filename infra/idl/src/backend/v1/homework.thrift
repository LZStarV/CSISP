// 作业领域类型
namespace js homework
include "./common.thrift"
include "./base.thrift"

// 作业基础信息
struct HomeworkBase {
  1: i32 classId,          // 班级ID（外键）
  2: string title,         // 作业标题
  3: string content,       // 作业内容
  4: base.Timestamp deadline, // 截止时间
  5: common.Status status  // 状态
}

// 作业完整信息
struct Homework {
  1: i32 id,                  // 作业唯一标识符
  2: HomeworkBase base,       // 基础信息
  3: base.Timestamp createdAt,// 创建时间
  4: base.Timestamp updatedAt // 更新时间
}

// 创建作业输入
struct CreateHomeworkInput {
  1: i32 classId,
  2: string title,
  3: string content,
  4: base.Timestamp deadline,
  5: common.Status status
}

// 更新作业输入
struct UpdateHomeworkInput {
  1: optional string title,
  2: optional string content,
  3: optional base.Timestamp deadline,
  4: optional common.Status status
}

// 作业提交基础信息
struct HomeworkSubmissionBase {
  1: i32 homeworkId, // 作业ID（外键）
  2: i32 userId,     // 用户ID（外键）
  3: string filePath,
  4: optional string fileName,
  5: optional string content
}

// 作业提交完整信息
struct HomeworkSubmission {
  1: i32 id,
  2: string status,
  3: base.Timestamp submitTime,
  4: base.Timestamp updatedAt,
  5: HomeworkSubmissionBase base
}

// 创建作业提交输入
struct CreateHomeworkSubmissionInput {
  1: i32 homeworkId,
  2: i32 userId,
  3: string filePath,
  4: optional string fileName,
  5: optional string content,
  6: string status,
  7: base.Timestamp submitTime
}

// 更新作业提交输入
struct UpdateHomeworkSubmissionInput {
  1: optional string status,
  2: optional string filePath,
  3: optional string fileName,
  4: optional string content
}

// 作业文件信息
struct HomeworkFile {
  1: i32 id,
  2: i32 submissionId,
  3: string fileName,
  4: string filePath,
  5: i64 fileSize,
  6: string fileType,
  7: base.Timestamp uploadTime
}

// 作业统计信息
struct HomeworkStat {
  1: i32 totalCount,
  2: i32 submittedCount,
  3: i32 gradedCount,
  4: i32 overdueCount,
  5: optional double averageScore
}
