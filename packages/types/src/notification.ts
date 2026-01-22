// 通知相关类型定义
import type { Timestamp } from './base';

/**
 * 通知基础信息
 */
export interface NotificationBase {
  type: string; // 通知类型
  title: string; // 通知标题
  content: string; // 通知内容
  targetUserId: number; // 目标用户ID（外键）
  senderId: number; // 发送者ID（外键）
  status: string; // 状态
}

/**
 * 通知完整信息
 */
export interface Notification extends NotificationBase {
  id: number; // 通知唯一标识符
  createdAt: Timestamp; // 创建时间
  updatedAt: Timestamp; // 更新时间
}

// 创建通知时的输入类型
export type CreateNotificationInput = Omit<
  Notification,
  'id' | 'createdAt' | 'updatedAt'
>;

// 更新通知时的输入类型
export type UpdateNotificationInput = Partial<
  Omit<
    Notification,
    'id' | 'targetUserId' | 'senderId' | 'createdAt' | 'updatedAt'
  >
>;

/**
 * 通知统计信息
 */
export interface NotificationStat {
  totalCount: number;
  unreadCount: number;
  systemCount: number;
  homeworkCount: number;
  attendanceCount: number;
  courseCount: number;
}
