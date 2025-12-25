import { AcademicConfigModel } from './academic-config.model';
import { User } from './user.model';
import { UserRole } from './user-role.model';
import { Role } from './role.model';
import { Permission } from './permission.model';
import { RolePermission } from './role-permission.model';
import { Course } from './course.model';
import { Class } from './class.model';
import { TimeSlot } from './time-slot.model';
import { Teacher } from './teacher.model';
import { SubCourse } from './sub-course.model';
import { CourseTeacher } from './course-teacher.model';
import { Schedule } from './schedule.model';
import { AttendanceTask } from './attendance-task.model';
import { AttendanceRecord } from './attendance-record.model';
import { Homework } from './homework.model';
import { HomeworkSubmission } from './homework-submission.model';
import { HomeworkFile } from './homework-file.model';
import { Notification } from './notification.model';

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
