// 考勤相关类型定义
import type { Status, Timestamp } from './base';

/**
 * 考勤状态枚举
 */
export type AttendanceStatus =
  | 'normal'
  | 'late'
  | 'absent'
  | 'leave'
  | 'not_checked';

/**
 * 考勤状态常量
 */
export const AttendanceStatus = {
  /** 正常出勤 */
  Normal: 'normal' as AttendanceStatus,
  /** 迟到 */
  Late: 'late' as AttendanceStatus,
  /** 缺勤 */
  Absent: 'absent' as AttendanceStatus,
  /** 请假 */
  Leave: 'leave' as AttendanceStatus,
  /** 未打卡 */
  NotChecked: 'not_checked' as AttendanceStatus,
};

/**
 * 考勤任务基础信息
 */
export interface AttendanceTaskBase {
  classId: number; // 班级ID（外键）
  taskName: string; // 任务名称
  taskType: string; // 任务类型
  startTime: Timestamp; // 开始时间
  endTime: Timestamp; // 结束时间
  status: Status; // 状态
}

/**
 * 考勤任务完整信息
 */
export interface AttendanceTask extends AttendanceTaskBase {
  id: number; // 任务唯一标识符
  createdAt: Timestamp; // 创建时间
  updatedAt: Timestamp; // 更新时间
}

// 创建考勤任务时的输入类型
export type CreateAttendanceTaskInput = Omit<
  AttendanceTask,
  'id' | 'createdAt' | 'updatedAt'
>;

// 更新考勤任务时的输入类型
export type UpdateAttendanceTaskInput = Partial<
  Omit<AttendanceTask, 'id' | 'classId' | 'createdAt' | 'updatedAt'>
>;

/**
 * 考勤记录基础信息
 */
export interface AttendanceRecordBase {
  attendanceTaskId: number; // 考勤任务ID（外键）
  userId: number; // 用户ID（外键）
  status: AttendanceStatus; // 考勤状态
  remark: string; // 备注
}

/**
 * 考勤记录完整信息
 */
export interface AttendanceRecord extends AttendanceRecordBase {
  id: number; // 记录唯一标识符
  createdAt: Timestamp; // 创建时间
  updatedAt: Timestamp; // 更新时间
}

// 创建考勤记录时的输入类型
export type CreateAttendanceRecordInput = Omit<
  AttendanceRecord,
  'id' | 'createdAt' | 'updatedAt'
>;

// 更新考勤记录时的输入类型
export type UpdateAttendanceRecordInput = Partial<
  Omit<
    AttendanceRecord,
    'id' | 'attendanceTaskId' | 'userId' | 'createdAt' | 'updatedAt'
  >
>;

/**
 * 考勤详情
 */
export interface AttendanceDetail {
  id: number;
  recordId: number;
  ipAddress: string;
  deviceInfo: string;
  location?: string;
}

/**
 * 学生打卡参数
 */
export interface CheckinParams {
  classId: number;
}

/**
 * 考勤统计信息
 */
export interface AttendanceStat {
  totalCount: number;
  normalCount: number;
  lateCount: number;
  absentCount: number;
  leaveCount: number;
  rate: number;
}

/**
 * 学生考勤统计
 */
export interface StudentAttendanceStat extends AttendanceStat {
  studentId: number;
  studentName: string;
}

/**
 * 考勤记录（兼容旧接口）
 */
export type Attendance = AttendanceRecord;
