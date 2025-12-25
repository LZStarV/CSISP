import { Module } from '@nestjs/common';
import { HealthModule } from '@modules/health/health.module';
import { SequelizePostgresModule } from '@infra/postgres/sequelize.module';
import { UserModule } from '@modules/user/user.module';
import { CourseModule } from '@modules/course/course.module';
import { AttendanceModule } from '@modules/attendance/attendance.module';
import { HomeworkModule } from '@modules/homework/homework.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ContentModule } from '@modules/content/content.module';

@Module({
  imports: [
    SequelizePostgresModule,
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017', {
      dbName: process.env.MONGODB_DB || 'csisp',
    }),
    HealthModule,
    UserModule,
    CourseModule,
    AttendanceModule,
    HomeworkModule,
    ContentModule,
  ],
})
export class AppModule {}
