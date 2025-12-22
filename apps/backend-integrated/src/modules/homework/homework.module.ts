import { Module } from '@nestjs/common';
import { HomeworkController } from './homework.controller';
import { HomeworkService } from './homework.service';

/**
 * 作业模块
 *
 * 负责作业发布、提交、统计与批改相关接口聚合。
 */
@Module({
  controllers: [HomeworkController],
  providers: [HomeworkService],
})
export class HomeworkModule {}
