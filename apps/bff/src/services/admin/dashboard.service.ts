import { createHttpClient } from '@csisp/upstream';

// Admin 仪表盘顶部统计卡片所需的核心指标
export interface AdminDashboardStats {
  // 系统用户总数
  userCount: number;
  // 课程总数（所有课程实例）
  courseCount: number;
  // 全局平均出勤率（0-100），由后端根据考勤记录计算
  attendanceRate: number; // 百分比或小数，视后端接口而定
  // 作业平均提交率（0-100），由后端根据作业与提交记录计算
  homeworkSubmissionRate: number; // 百分比（0-100）
  // 当前系统内通知条数（可用于提醒管理员未读或总通知数）
  notificationCount: number;
}

// 折线图：按日期聚合的用户增长数据点
export interface UserGrowthPoint {
  // 日期（YYYY-MM-DD）
  date: string;
  // 当日新增用户数量
  count: number;
}

// 饼图：课程分布（按某种维度聚合，如课程类型或学院）
export interface CourseDistributionItem {
  // 分组名称
  name: string;
  // 该分组下的课程数量
  value: number;
}

// 时间线：最近活动流，混合展示考勤、作业、通知等事件
export interface RecentActivityItem {
  // 活动唯一标识
  id: number;
  // 活动类型，用于前端映射不同的展示样式
  type: 'attendance' | 'homework' | 'notification' | 'course' | string;
  // 列表主标题（例如“发布新作业”、“创建考勤任务”）
  title: string;
  // 辅助描述信息
  description: string;
  // 活动发生时间（ISO 字符串）
  timestamp: string;
  // 关联用户信息（如操作人或学生），可选字段
  user?: { id: number; realName: string };
}

// Admin 概览聚合返回结构，供前端仪表盘一次性获取所有数据
export interface AdminOverviewResult {
  // 顶部统计卡片数据
  stats: AdminDashboardStats;
  // 用户增长折线图数据
  userGrowth: UserGrowthPoint[];
  // 课程分布饼图数据
  courseDistribution: CourseDistributionItem[];
  // 最近活动时间线数据
  recentActivities: RecentActivityItem[];
  // 若部分上游接口失败，将错误信息聚合在 meta 中
  meta?: { error: string };
}

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
  const backendClient = createHttpClient({
    baseURL: process.env.BACKEND_INTEGRATED_URL as string,
    headers,
  });
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
    const [statsPayload, userGrowthPayload, courseDistPayload, recentActPayload] =
      await Promise.all([
        safeJson(backendClient.get('/api/dashboard/stats'), 'dashboard.stats'),
        safeJson(
          backendClient.get(`/api/dashboard/user-growth?days=${days}`),
          'dashboard.userGrowth'
        ),
        safeJson(
          backendClient.get('/api/dashboard/course-distribution'),
          'dashboard.courseDistribution'
        ),
        safeJson(
          backendClient.get(`/api/dashboard/recent-activities?limit=${limit}`),
          'dashboard.recentActivities'
        ),
      ]);

    // 解析统计数据，若后端未返回则使用兜底逻辑计算部分字段
    const statsData = unwrapData(statsPayload) || {};
    let userCount = toNum((statsData as any).userCount);
    let courseCount = toNum((statsData as any).courseCount);
    const attendanceRate = toNum((statsData as any).attendanceRate);
    const homeworkSubmissionRate = toNum((statsData as any).homeworkSubmissionRate);
    const notificationCount = toNum((statsData as any).notificationCount);

    if (!statsPayload) {
      try {
        const users = await backendClient.json(backendClient.get('/api/users?page=1&size=1'));
        userCount = pickTotal(users);
      } catch {}
      try {
        const courses = await backendClient.json(backendClient.get('/api/courses?page=1&size=1'));
        courseCount = pickTotal(courses);
      } catch {}
    }

    // 归一化折线图和图表数据，避免前端处理 undefined / null
    const userGrowth = Array.isArray(unwrapData(userGrowthPayload))
      ? (unwrapData(userGrowthPayload) as any[])
      : [];
    const courseDistribution = Array.isArray(unwrapData(courseDistPayload))
      ? (unwrapData(courseDistPayload) as any[])
      : [];
    const recentActivities = Array.isArray(unwrapData(recentActPayload))
      ? (unwrapData(recentActPayload) as any[])
      : [];

    // 聚合最终结果，字段尽量保持稳定，便于前端直接消费
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
          user:
            a?.user && typeof a.user === 'object'
              ? { id: toNum(a.user?.id), realName: String(a.user?.realName ?? '') }
              : undefined,
        }))
        .filter(a => a.id && a.title && a.timestamp),
      meta: errors.length ? { error: errors.join(' | ') } : undefined,
    } satisfies AdminOverviewResult;
  } catch (e: any) {
    // 发生未捕获异常时，返回兜底结构并附带错误原因，避免前端崩溃
    const reason = e?.message || 'Upstream error';
    return { ...defaults, meta: { error: reason } } as AdminOverviewResult;
  }
}
