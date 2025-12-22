import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import type { ApiResponse } from '@csisp/types';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { DashboardService } from './dashboard.service';

/**
 * 仪表盘控制器（Nest 版本）
 *
 * 提供总体统计、用户增长、课程分布与最近活动等接口。
 */
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getStats(): Promise<ApiResponse<any>> {
    return this.dashboardService.getStats();
  }

  @Get('user-growth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getUserGrowth(@Query('days') daysQuery?: string): Promise<ApiResponse<any>> {
    const days = daysQuery ? Number(daysQuery) : 30;
    const safeDays = Number.isFinite(days) && days > 0 && days <= 180 ? days : 30;
    return this.dashboardService.getUserGrowth(safeDays);
  }

  @Get('course-distribution')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getCourseDistribution(): Promise<ApiResponse<any>> {
    return this.dashboardService.getCourseDistribution();
  }

  @Get('recent-activities')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getRecentActivities(@Query('limit') limitQuery?: string): Promise<ApiResponse<any>> {
    const limit = limitQuery ? Number(limitQuery) : 10;
    const safeLimit = Number.isFinite(limit) && limit > 0 && limit <= 100 ? limit : 10;
    return this.dashboardService.getRecentActivities(safeLimit);
  }
}
