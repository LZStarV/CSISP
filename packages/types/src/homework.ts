// 作业相关类型定义
import type { Status, Timestamp } from './base';

/**
 * 作业基础信息
 */
export interface HomeworkBase {
  classId: number; // 班级ID（外键）
  title: string; // 作业标题
  content: string; // 作业内容
  deadline: Timestamp; // 截止时间
  status: Status; // 状态
}

/**
 * 作业完整信息
 */
export interface Homework extends HomeworkBase {
  id: number; // 作业唯一标识符
  createdAt: Timestamp; // 创建时间
  updatedAt: Timestamp; // 更新时间
}

// 创建作业时的输入类型
export type CreateHomeworkInput = Omit<
  Homework,
  'id' | 'createdAt' | 'updatedAt'
>;

// 更新作业时的输入类型
export type UpdateHomeworkInput = Partial<
  Omit<Homework, 'id' | 'classId' | 'createdAt' | 'updatedAt'>
>;

/**
 * 作业提交基础信息
 */
export interface HomeworkSubmissionBase {
  homeworkId: number; // 作业ID（外键）
  userId: number; // 用户ID（外键）
  filePath: string;
  fileName?: string;
  content?: string;
}

/**
 * 作业提交完整信息
 */
export interface HomeworkSubmission extends HomeworkSubmissionBase {
  id: number;
  status: string;
  submitTime: Timestamp;
  updatedAt: Timestamp;
}

// 创建作业提交时的输入类型
export type CreateHomeworkSubmissionInput = Omit<
  HomeworkSubmission,
  'id' | 'updatedAt'
>;

// 更新作业提交时的输入类型
export type UpdateHomeworkSubmissionInput = Partial<
  Omit<HomeworkSubmission, 'id' | 'homeworkId' | 'userId' | 'updatedAt'>
>;

/**
 * 作业文件信息
 */
export interface HomeworkFile {
  id: number;
  submissionId: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  uploadTime: Timestamp;
}

/**
 * 作业统计信息
 */
export interface HomeworkStat {
  totalCount: number;
  submittedCount: number;
  gradedCount: number;
  overdueCount: number;
  averageScore?: number;
}
