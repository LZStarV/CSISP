import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';

/**
 * 考勤模块
 *
 * 对齐旧 Koa backend 的 /api/attendance 路由，
 * 负责考勤任务、打卡与统计相关接口聚合。
 */
@Module({
  controllers: [AttendanceController],
  providers: [AttendanceService],
})
export class AttendanceModule {}
