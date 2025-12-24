import { createBffHttpClient } from '@infra/bff.client';
import { z } from 'zod';
import {
  AdminDashboardStatsSchema,
  UserGrowthPointSchema,
  CourseDistributionItemSchema,
  RecentActivityItemSchema,
  AdminOverviewResultSchema,
} from '@schemas/admin/dashboard.schema';

// Admin 仪表盘顶部统计卡片所需的核心指标
export type AdminDashboardStats = z.infer<typeof AdminDashboardStatsSchema>;

// 折线图：按日期聚合的用户增长数据点
export type UserGrowthPoint = z.infer<typeof UserGrowthPointSchema>;

// 饼图：课程分布（按某种维度聚合，如课程类型或学院）
export type CourseDistributionItem = z.infer<typeof CourseDistributionItemSchema>;

// 时间线：最近活动流，混合展示考勤、作业、通知等事件
export type RecentActivityItem = z.infer<typeof RecentActivityItemSchema>;

// Admin 概览聚合返回结构，供前端仪表盘一次性获取所有数据
export type AdminOverviewResult = z.infer<typeof AdminOverviewResultSchema>;

/**
 * Admin 概览聚合：并发拉取领域接口并计算统计数据
 * - 若后端提供 /api/dashboard/* 聚合类接口，则优先使用；否则从领域接口中计算填充
 * - 透传 Authorization 与 X-Trace-Id 到后端，保证链路追踪与权限校验一致
 *
 * @param days      用户增长趋势统计的时间窗口（天数）
 * @param limit     最近活动列表的最大数量
 * @param traceId   链路追踪 ID，由上游中间件或前端注入
 * @param authHeader BFF 侧收到的 Authorization 头，将原样透传到后端
 */
export async function aggregateAdminOverview(
  days = 30,
  limit = 10,
  traceId?: string,
  authHeader?: string
): Promise<AdminOverviewResult> {
  // 组装需要透传到后端的请求头
  const headers: Record<string, string> = {};
  if (traceId) headers['X-Trace-Id'] = traceId;
  if (authHeader) headers['Authorization'] = authHeader;
  const backendClient = createBffHttpClient(headers, traceId);
  // BFF 兜底返回结构：即使部分上游接口失败，也保证字段完整
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
    // 兼容后端返回 `ApiResponse` 或直接数据结构
    const unwrapData = (payload: any) =>
      payload && payload.data !== undefined ? payload.data : payload;

    // 尝试从分页响应中提取 total 字段
    const pickTotal = (payload: any): number => {
      if (!payload) return 0;
      if (typeof payload.total === 'number') return payload.total;
      const data = unwrapData(payload);
      if (data && typeof data.total === 'number') return data.total;
      const pageObj = payload.pagination || payload.page || payload.meta;
      if (pageObj && typeof pageObj.total === 'number') return pageObj.total;
      return 0;
    };

    // 保证数值类型安全，非有限数字一律按 0 处理
    const toNum = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

    // 收集各个上游接口调用过程中的错误信息
    const errors: string[] = [];

    // 对单个上游请求进行包装，失败时记录错误并返回 undefined
    const safeJson = async (req: Promise<any>, label: string) => {
      try {
        return await backendClient.json(req);
      } catch (e: any) {
        errors.push(`${label}:${e?.message || 'Upstream error'}`);
        return undefined;
      }
    };

    // 并发拉取仪表盘相关的四类数据
    const [
      userStatsPayload,
      usersPagePayload,
      coursesPayload,
      attendanceAvgPayload,
      homeworkRatePayload,
      contentStatsPayload,
      recentPayload,
      courseDistPayload,
    ] = await Promise.all([
      safeJson(backendClient.get('/api/users/stats'), 'users.stats'),
      safeJson(backendClient.get('/api/users?page=1&size=1'), 'users.page'),
      safeJson(backendClient.get('/api/courses?page=1&size=1'), 'courses.count'),
      safeJson(backendClient.get('/api/attendance/stats/average'), 'attendance.avg'),
      safeJson(backendClient.get('/api/homework/stats/submission-rate'), 'homework.rate'),
      safeJson(backendClient.get('/api/contents/stats'), 'contents.stats'),
      safeJson(backendClient.get(`/api/contents/recent?limit=${limit}`), 'contents.recent'),
      safeJson(backendClient.get('/api/courses/distribution'), 'courses.distribution'),
    ]);

    const userCount =
      toNum(unwrapData(userStatsPayload)?.totalCount) ||
      pickTotal(userStatsPayload) ||
      pickTotal(usersPagePayload);
    const courseCount = pickTotal(coursesPayload);
    const attendanceRate = toNum(unwrapData(attendanceAvgPayload)?.rate);
    const homeworkSubmissionRate = toNum(unwrapData(homeworkRatePayload)?.rate);
    const notificationCount = toNum(unwrapData(contentStatsPayload)?.notificationCount);

    const userGrowthRaw = unwrapData(userStatsPayload)?.yearStats || [];
    const userGrowth = Array.isArray(userGrowthRaw)
      ? userGrowthRaw.map((i: any) => ({
          date: String(i?.enrollment_year ?? ''),
          count: toNum(i?.count),
        }))
      : [];

    const courseDistributionRaw = unwrapData(courseDistPayload) || [];
    const courseDistribution = Array.isArray(courseDistributionRaw)
      ? courseDistributionRaw.map((i: any) => ({
          name: String(i?.name ?? ''),
          value: toNum(i?.value),
        }))
      : [];

    const recentActivitiesRaw = unwrapData(recentPayload) || [];
    const recentActivities = Array.isArray(recentActivitiesRaw)
      ? recentActivitiesRaw.map((a: any) => ({
          id: toNum(a?.id),
          type: String(a?.type ?? ''),
          title: String(a?.title ?? ''),
          description: String(a?.description ?? ''),
          timestamp: String(a?.timestamp ?? ''),
        }))
      : [];

    const allUndefined = [
      userStatsPayload,
      usersPagePayload,
      coursesPayload,
      attendanceAvgPayload,
      homeworkRatePayload,
      contentStatsPayload,
      recentPayload,
      courseDistPayload,
    ].every(v => v === undefined);

    return {
      stats: {
        userCount,
        courseCount,
        attendanceRate,
        homeworkSubmissionRate,
        notificationCount,
      },
      userGrowth: userGrowth
        .map(p => ({ date: String(p?.date ?? ''), count: toNum(p?.count) }))
        .filter(p => p.date),
      courseDistribution: courseDistribution
        .map(i => ({ name: String(i?.name ?? ''), value: toNum(i?.value) }))
        .filter(i => i.name),
      recentActivities: recentActivities
        .map(a => ({
          id: toNum(a?.id),
          type: String(a?.type ?? ''),
          title: String(a?.title ?? ''),
          description: String(a?.description ?? ''),
          timestamp: String(a?.timestamp ?? ''),
        }))
        .filter(a => a.title && a.timestamp),
      meta: allUndefined ? { error: errors.join(' | ') } : undefined,
    } satisfies AdminOverviewResult;
  } catch (e: any) {
    // 发生未捕获异常时，返回兜底结构并附带错误原因，避免前端崩溃
    const reason = e?.message || 'Upstream error';
    return { ...defaults, meta: { error: reason } } as AdminOverviewResult;
  }
}
