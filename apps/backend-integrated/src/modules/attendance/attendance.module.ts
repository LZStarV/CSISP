import { Module } from '@nestjs/common';
import { RolesGuard } from '@common/guards/roles.guard';
import { SequelizePostgresModule } from '@infra/postgres/sequelize.module';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';

/**
 * 考勤模块
 *
 * 对齐旧 Koa backend 的 /api/attendance 路由，
 * 负责考勤任务、打卡与统计相关接口聚合。
 */
@Module({
  imports: [SequelizePostgresModule],
  controllers: [AttendanceController],
  providers: [
    {
      provide: 'ATTENDANCE_SERVICE',
      useClass: AttendanceService,
    },
    RolesGuard,
  ],
})
export class AttendanceModule {}
