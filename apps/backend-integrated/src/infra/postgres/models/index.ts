import { AcademicConfigModel } from './academic-config.model';
import { AttendanceRecord } from './attendance-record.model';
import { AttendanceTask } from './attendance-task.model';
import { Class } from './class.model';
import { CourseTeacher } from './course-teacher.model';
import { Course } from './course.model';
import { HomeworkFile } from './homework-file.model';
import { HomeworkSubmission } from './homework-submission.model';
import { Homework } from './homework.model';
import { Notification } from './notification.model';
import { Permission } from './permission.model';
import { RolePermission } from './role-permission.model';
import { Role } from './role.model';
import { Schedule } from './schedule.model';
import { SubCourse } from './sub-course.model';
import { Teacher } from './teacher.model';
import { TimeSlot } from './time-slot.model';
import { UserRole } from './user-role.model';
import { User } from './user.model';

export const POSTGRES_MODELS = [
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
] as const;
