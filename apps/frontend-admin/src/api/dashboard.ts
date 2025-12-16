import { request } from './request';
import type { ApiResponse } from '@csisp/types';

// 仪表盘统计信息
export interface DashboardStats {
  userCount: number;
  courseCount: number;
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

export interface AdminOverviewResponse {
  stats: DashboardStats;
  userGrowth: UserGrowthData[];
  courseDistribution: CourseDistributionData[];
  recentActivities: RecentActivity[];
}

export const dashboardApi = {
  getAdminOverview: (
    days: number = 30,
    limit: number = 10
  ): Promise<ApiResponse<AdminOverviewResponse>> => {
    return request.get('/admin/dashboard/overview', { params: { days, limit } });
  },
};
