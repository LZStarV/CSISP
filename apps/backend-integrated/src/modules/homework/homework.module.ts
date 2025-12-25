import { Module } from '@nestjs/common';
import { ContentModule } from '../content/content.module';
import { RolesGuard } from '@common/guards/roles.guard';
import { SequelizePostgresModule } from '@infra/postgres/sequelize.module';
import { HomeworkController } from './homework.controller';
import { HomeworkService } from './homework.service';

/**
 * 作业模块
 *
 * 负责作业发布、提交、统计与批改相关接口聚合。
 */
@Module({
  imports: [ContentModule, SequelizePostgresModule],
  controllers: [HomeworkController],
  providers: [
    {
      provide: 'HOMEWORK_SERVICE',
      useClass: HomeworkService,
    },
    RolesGuard,
  ],
})
export class HomeworkModule {}
