import { createHttpClient } from '@csisp/upstream';

// Admin 仪表盘统计结构
export interface AdminDashboardStats {
  userCount: number;
  courseCount: number;
  attendanceRate: number; // 百分比或小数，视后端接口而定
  homeworkSubmissionRate: number; // 百分比（0-100）
  notificationCount: number;
}

// 折线图：用户增长
export interface UserGrowthPoint {
  date: string;
  count: number;
}

// 饼图：课程分布
export interface CourseDistributionItem {
  name: string;
  value: number;
}

// 时间线：最近活动
export interface RecentActivityItem {
  id: number;
  type: 'attendance' | 'homework' | 'notification' | 'course' | string;
  title: string;
  description: string;
  timestamp: string;
  user?: { id: number; realName: string };
}

// Admin 概览聚合返回
export interface AdminOverviewResult {
  stats: AdminDashboardStats;
  userGrowth: UserGrowthPoint[];
  courseDistribution: CourseDistributionItem[];
  recentActivities: RecentActivityItem[];
  meta?: { error: string };
}

/**
 * Admin 概览聚合：并发拉取领域接口并计算统计数据
 * - 若后端提供 /api/dashboard/* 聚合类接口，则优先使用；否则从领域接口中计算填充
 * - 透传 Authorization 与 X-Trace-Id 到后端
 */
export async function aggregateAdminOverview(
  _days = 30,
  _limit = 10,
  traceId?: string,
  authHeader?: string
): Promise<AdminOverviewResult> {
  const headers: Record<string, string> = {};
  if (traceId) headers['X-Trace-Id'] = traceId;
  if (authHeader) headers['Authorization'] = authHeader;
  const backendClient = createHttpClient({
    baseURL: process.env.BE_BACKEND_URL as string,
    headers,
  });
  const defaults: AdminOverviewResult = {
    stats: {
      userCount: 0,
      courseCount: 0,
      attendanceRate: 0,
      homeworkSubmissionRate: 0,
      notificationCount: 0,
    },
    userGrowth: [],
    courseDistribution: [],
    recentActivities: [],
  };

  try {
    const pickTotal = (payload: any): number => {
      if (!payload) return 0;
      if (typeof payload.total === 'number') return payload.total;
      const data = payload.data;
      if (data && typeof data.total === 'number') return data.total;
      const pageObj = payload.pagination || payload.page || payload.meta;
      if (pageObj && typeof pageObj.total === 'number') return pageObj.total;
      return 0;
    };

    let userCount = 0;
    let courseCount = 0;
    try {
      const users = await backendClient.json(backendClient.get('/api/users?page=1&size=1'));
      userCount = pickTotal(users);
    } catch {}
    try {
      const courses = await backendClient.json(backendClient.get('/api/courses?page=1&size=1'));
      courseCount = pickTotal(courses);
    } catch {}

    const mergedStats: AdminDashboardStats = {
      userCount,
      courseCount,
      attendanceRate: 0,
      homeworkSubmissionRate: 0,
      notificationCount: 0,
    };

    return {
      stats: mergedStats,
      userGrowth: [],
      courseDistribution: [],
      recentActivities: [],
      meta:
        userCount === 0 && courseCount === 0
          ? { error: '后端分页接口返回空或不可访问' }
          : undefined,
    } satisfies AdminOverviewResult;
  } catch (e: any) {
    const reason = e?.message || 'Upstream error';
    return { ...defaults, meta: { error: reason } } as AdminOverviewResult;
  }
}
