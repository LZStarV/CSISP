// 通知领域类型
namespace js notification
include "./base.thrift"

// 通知基础信息
struct NotificationBase {
  1: string type,        // 通知类型
  2: string title,       // 通知标题
  3: string content,     // 通知内容
  4: i32 targetUserId,   // 目标用户ID（外键）
  5: i32 senderId,       // 发送者ID（外键）
  6: string status       // 状态
}

// 通知完整信息
struct Notification {
  1: i32 id,                  // 通知唯一标识符
  2: NotificationBase base,   // 基础信息
  3: base.Timestamp createdAt,// 创建时间
  4: base.Timestamp updatedAt // 更新时间
}

// 创建通知输入
struct CreateNotificationInput {
  1: string type,
  2: string title,
  3: string content,
  4: i32 targetUserId,
  5: i32 senderId,
  6: string status
}

// 更新通知输入
struct UpdateNotificationInput {
  1: optional string title,
  2: optional string content,
  3: optional string status
}

// 通知统计信息
struct NotificationStat {
  1: i32 totalCount,
  2: i32 unreadCount,
  3: i32 systemCount,
  4: i32 homeworkCount,
  5: i32 attendanceCount,
  6: i32 courseCount
}
