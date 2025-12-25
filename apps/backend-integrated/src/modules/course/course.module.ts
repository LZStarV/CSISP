import { Module } from '@nestjs/common';
import { RolesGuard } from '@common/guards/roles.guard';
import { SequelizePostgresModule } from '@infra/postgres/sequelize.module';
import { CourseService } from '@modules/course/course.service';
import { CourseController } from '@modules/course/course.controller';

/**
 * 课程模块
 *
 * 负责课程、班级、子课程、时间段等相关接口聚合。
 */
@Module({
  imports: [SequelizePostgresModule],
  providers: [
    {
      provide: 'COURSE_SERVICE',
      useClass: CourseService,
    },
    RolesGuard,
  ],
  controllers: [CourseController],
})
export class CourseModule {}
