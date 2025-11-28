import { request } from './request';
import type { ApiResponse, PaginationResponse } from '@csisp/types';

// 仪表盘统计信息
export interface DashboardStats {
  userCount: number;
  courseCount: number;
  classCount: number;
  attendanceRate: number;
  homeworkSubmissionRate: number;
  notificationCount: number;
}

// 用户增长数据
export interface UserGrowthData {
  date: string;
  count: number;
}

// 课程分布数据
export interface CourseDistributionData {
  name: string;
  value: number;
}

// 考勤趋势数据
export interface AttendanceTrendData {
  date: string;
  rate: number;
}

// 作业统计数据
export interface HomeworkStatsData {
  submitted: number;
  total: number;
  averageScore: number;
}

// 最近活动
export interface RecentActivity {
  id: number;
  type: 'attendance' | 'homework' | 'notification' | 'course';
  title: string;
  description: string;
  timestamp: string;
  user: {
    id: number;
    realName: string;
  };
}

export const dashboardApi = {
  // 获取仪表盘统计数据
  getDashboardStats: (): Promise<ApiResponse<DashboardStats>> => {
    return request.get('/dashboard/stats');
  },

  // 获取实时统计数据
  getRealtimeStats: (): Promise<
    ApiResponse<{
      onlineUsers: number;
      activeCourses: number;
      ongoingAttendance: number;
      pendingHomework: number;
    }>
  > => {
    return request.get('/dashboard/realtime-stats');
  },

  // 获取用户增长数据
  getUserGrowth: (days: number = 30): Promise<ApiResponse<UserGrowthData[]>> => {
    return request.get('/dashboard/user-growth', { params: { days } });
  },

  // 获取课程分布数据
  getCourseDistribution: (): Promise<ApiResponse<CourseDistributionData[]>> => {
    return request.get('/dashboard/course-distribution');
  },

  // 获取考勤趋势数据
  getAttendanceTrend: (days: number = 30): Promise<ApiResponse<AttendanceTrendData[]>> => {
    return request.get('/dashboard/attendance-trend', { params: { days } });
  },

  // 获取作业统计数据
  getHomeworkStats: (): Promise<ApiResponse<HomeworkStatsData>> => {
    return request.get('/dashboard/homework-stats');
  },

  // 获取最近活动列表
  getRecentActivities: (limit: number = 10): Promise<ApiResponse<RecentActivity[]>> => {
    return request.get('/dashboard/recent-activities', { params: { limit } });
  },
};
