import { Module } from '@nestjs/common';
import { SequelizeModule, type SequelizeModuleOptions } from '@nestjs/sequelize';
import { AcademicConfigModel } from './models/academic-config.model';
import { User } from './models/user.model';
import { UserRole } from './models/user-role.model';
import { Role } from './models/role.model';
import { Permission } from './models/permission.model';
import { RolePermission } from './models/role-permission.model';
import { Course } from './models/course.model';
import { Class } from './models/class.model';
import { TimeSlot } from './models/time-slot.model';
import { Teacher } from './models/teacher.model';
import { SubCourse } from './models/sub-course.model';
import { CourseTeacher } from './models/course-teacher.model';
import { Schedule } from './models/schedule.model';
import { AttendanceTask } from './models/attendance-task.model';
import { AttendanceRecord } from './models/attendance-record.model';
import { Homework } from './models/homework.model';
import { HomeworkSubmission } from './models/homework-submission.model';
import { HomeworkFile } from './models/homework-file.model';
import { Notification } from './models/notification.model';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      useFactory: (): SequelizeModuleOptions =>
        ({
          dialect: 'postgres',
          host: process.env.DB_HOST ?? 'localhost',
          port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5433,
          database: process.env.DB_NAME ?? 'csisp',
          username: process.env.DB_USER ?? 'admin',
          password: process.env.DB_PASSWORD ?? 'replace-me',
          logging: false,
          models: [
            AcademicConfigModel,
            User,
            UserRole,
            Role,
            Permission,
            RolePermission,
            Course,
            Class,
            TimeSlot,
            Teacher,
            SubCourse,
            CourseTeacher,
            Schedule,
            AttendanceTask,
            AttendanceRecord,
            Homework,
            HomeworkSubmission,
            HomeworkFile,
            Notification,
          ],
          autoLoadModels: false,
          synchronize: false,
        }) as SequelizeModuleOptions,
    }),
    SequelizeModule.forFeature([
      AcademicConfigModel,
      User,
      UserRole,
      Role,
      Permission,
      RolePermission,
      Course,
      Class,
      TimeSlot,
      Teacher,
      SubCourse,
      CourseTeacher,
      Schedule,
      AttendanceTask,
      AttendanceRecord,
      Homework,
      HomeworkSubmission,
      HomeworkFile,
      Notification,
    ]),
  ],
  exports: [SequelizeModule],
})
export class SequelizePostgresModule {}
