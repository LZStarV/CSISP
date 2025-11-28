import { AppContext } from '../types/context';
import { BaseController } from './BaseController';

export class DashboardController extends BaseController {
  private dashboardService: any;
  constructor(dashboardService: any) {
    super();
    this.dashboardService = dashboardService;
  }

  /**
   * @swagger
   * /api/dashboard/stats:
   *   get:
   *     summary: 获取仪表盘统计数据
   *     tags: [Dashboard]
   *     responses:
   *       200: { description: 成功 }
   */
  async getStats(ctx: AppContext): Promise<void> {
    const res = await this.dashboardService.getStats();
    this.handleServiceResponse(ctx, res);
  }

  /**
   * @swagger
   * /api/dashboard/user-growth:
   *   get:
   *     summary: 获取用户增长数据
   *     tags: [Dashboard]
   *     parameters:
   *       - in: query
   *         name: days
   *         schema: { type: integer, minimum: 1, maximum: 180 }
   *     responses:
   *       200: { description: 成功 }
   */
  async getUserGrowth(ctx: AppContext): Promise<void> {
    const days = parseInt((ctx.query.days as string) || '30');
    const res = await this.dashboardService.getUserGrowth(isNaN(days) ? 30 : days);
    this.handleServiceResponse(ctx, res);
  }

  /**
   * @swagger
   * /api/dashboard/course-distribution:
   *   get:
   *     summary: 获取课程分布数据
   *     tags: [Dashboard]
   *     responses:
   *       200: { description: 成功 }
   */
  async getCourseDistribution(ctx: AppContext): Promise<void> {
    const res = await this.dashboardService.getCourseDistribution();
    this.handleServiceResponse(ctx, res);
  }

  /**
   * @swagger
   * /api/dashboard/recent-activities:
   *   get:
   *     summary: 获取最近活动列表
   *     tags: [Dashboard]
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema: { type: integer, minimum: 1, maximum: 100 }
   *     responses:
   *       200: { description: 成功 }
   */
  async getRecentActivities(ctx: AppContext): Promise<void> {
    const limit = parseInt((ctx.query.limit as string) || '10');
    const res = await this.dashboardService.getRecentActivities(isNaN(limit) ? 10 : limit);
    this.handleServiceResponse(ctx, res);
  }
}
