import { Module } from '@nestjs/common';
import { HealthModule } from './modules/health/health.module';
import { PostgresModule } from './infra/postgres/postgres.module';
import { UserModule } from './modules/user/user.module';
import { CourseModule } from './modules/course/course.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { HomeworkModule } from './modules/homework/homework.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    PostgresModule,
    HealthModule,
    UserModule,
    CourseModule,
    AttendanceModule,
    HomeworkModule,
    DashboardModule,
  ],
})
export class AppModule {}
