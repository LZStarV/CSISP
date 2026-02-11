import type { Sequelize } from 'sequelize-typescript';

// 表模型导入（每表一文件）
import { AcademicConfig } from './tables/academic_config';
import { AttendanceRecord } from './tables/attendance_record';
import { AttendanceTask } from './tables/attendance_task';
import { ClassModel } from './tables/class';
import { Course } from './tables/course';
import { CourseRep } from './tables/course_rep';
import { CourseTeacher } from './tables/course_teacher';
import { Homework } from './tables/homework';
import { HomeworkFile } from './tables/homework_file';
import { HomeworkSubmission } from './tables/homework_submission';
import { MfaSettings } from './tables/mfa_settings';
import { Notification } from './tables/notification';
import { OidcClients } from './tables/oidc_clients';
import { OidcKeys } from './tables/oidc_keys';
import { PasswordResets } from './tables/password_resets';
import { Permission } from './tables/permission';
import { RefreshTokens } from './tables/refresh_tokens';
import { Role } from './tables/role';
import { RolePermission } from './tables/role_permission';
import { Schedule } from './tables/schedule';
import { SubCourse } from './tables/sub_course';
import { Teacher } from './tables/teacher';
import { TimeSlot } from './tables/time_slot';
import { User } from './tables/user';
import { UserClass } from './tables/user_class';
import { UserRole } from './tables/user_role';

export function registerSpecModels(sequelize: Sequelize) {
  sequelize.addModels([
    User,
    Role,
    UserRole,
    Teacher,
    Course,
    ClassModel,
    CourseTeacher,
    UserClass,
    TimeSlot,
    AttendanceTask,
    AttendanceRecord,
    AcademicConfig,
    SubCourse,
    Schedule,
    Homework,
    HomeworkSubmission,
    HomeworkFile,
    Notification,
    Permission,
    RolePermission,
    CourseRep,
    MfaSettings,
    PasswordResets,
    OidcKeys,
    OidcClients,
    RefreshTokens,
  ]);
}
