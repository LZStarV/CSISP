// 数据库模型相关类型定义
import { Model, Optional, ModelStatic, Sequelize } from 'sequelize';
import { Status, UserRoleType, AttendanceStatus, Semester, MajorList } from '@csisp/types';

// 作业状态类型
export type HomeworkStatus = 'pending' | 'submitted' | 'graded' | 'late';

// 通知类型类型
export type NotificationType = 'system' | 'course' | 'homework' | 'attendance' | 'announcement';

/**
 * 用户模型属性
 */
export interface UserAttributes {
  id: number;
  username: string;
  password: string;
  realName: string;
  email: string;
  phone: string;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 用户模型创建属性（可选id、createdAt和updatedAt）
 */
export type UserCreationAttributes = Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * 用户模型接口
 */
export interface UserModel extends Model<UserAttributes, UserCreationAttributes>, UserAttributes {
  // 实例方法
  verifyPassword: (password: string) => Promise<boolean>;
  getRoles: () => Promise<UserRoleModel[]>;
  hasRole: (role: UserRoleType) => Promise<boolean>;
  hasPermission: (permission: string) => Promise<boolean>;
}

/**
 * 角色模型属性
 */
export interface RoleAttributes {
  id: number;
  name: string;
  description: string;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 角色模型创建属性
 */
export type RoleCreationAttributes = Optional<RoleAttributes, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * 角色模型接口
 */
export interface RoleModel extends Model<RoleAttributes, RoleCreationAttributes>, RoleAttributes {}

/**
 * 用户角色关联模型属性
 */
export interface UserRoleAttributes {
  id?: number;
  userId: number;
  roleId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * 用户角色关联模型创建属性
 */
export type UserRoleCreationAttributes = Optional<
  UserRoleAttributes,
  'id' | 'createdAt' | 'updatedAt'
>;

/**
 * 用户角色关联模型接口
 */
export interface UserRoleModel
  extends Model<UserRoleAttributes, UserRoleCreationAttributes>, UserRoleAttributes {
  getUser: () => Promise<UserModel>;
  getRole: () => Promise<RoleModel>;
}

/**
 * 课程模型属性
 */
export interface CourseAttributes {
  id: number;
  courseName: string;
  courseCode: string;
  status: Status;
  semester: Semester;
  academicYear: number;
  availableMajors: MajorList;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 课程模型创建属性
 */
export type CourseCreationAttributes = Optional<CourseAttributes, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * 课程模型接口
 */
export interface CourseModel
  extends Model<CourseAttributes, CourseCreationAttributes>, CourseAttributes {
  getTeachers: () => Promise<TeacherModel[]>;
  getTimeSlots: () => Promise<TimeSlotModel[]>;
  getClasses: () => Promise<ClassModel[]>;
  getStudents: () => Promise<UserModel[]>;
}

/**
 * 教师模型属性
 */
export interface TeacherAttributes {
  id: number;
  realName: string;
  email: string;
  phone: string;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 教师模型创建属性
 */
export type TeacherCreationAttributes = Optional<
  TeacherAttributes,
  'id' | 'createdAt' | 'updatedAt'
>;

/**
 * 教师模型接口
 */
export interface TeacherModel
  extends Model<TeacherAttributes, TeacherCreationAttributes>, TeacherAttributes {
  getCourses: () => Promise<CourseModel[]>;
}

/**
 * 时间槽模型属性
 */
export interface TimeSlotAttributes {
  id: number;
  subCourseId: number;
  weekday: number;
  startTime: string;
  endTime: string;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 时间槽模型创建属性
 */
export type TimeSlotCreationAttributes = Optional<
  TimeSlotAttributes,
  'id' | 'createdAt' | 'updatedAt'
>;

/**
 * 时间槽模型接口
 */
export interface TimeSlotModel
  extends Model<TimeSlotAttributes, TimeSlotCreationAttributes>, TimeSlotAttributes {}

/**
 * 班级模型属性
 */
export interface ClassAttributes {
  id: number;
  courseId: number;
  className: string;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 班级模型创建属性
 */
export type ClassCreationAttributes = Optional<ClassAttributes, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * 班级模型接口
 */
export interface ClassModel
  extends Model<ClassAttributes, ClassCreationAttributes>, ClassAttributes {
  getCourse: () => Promise<CourseModel>;
  getStudents: () => Promise<UserModel[]>;
}

/**
 * 考勤任务模型属性
 */
export interface AttendanceTaskAttributes {
  id: number;
  classId: number; // 根据文档应该是classId而不是courseId
  taskName: string; // 添加taskName字段
  taskType: string; // 添加taskType字段
  startTime: Date;
  endTime: Date;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 考勤任务模型创建属性
 */
export type AttendanceTaskCreationAttributes = Optional<
  AttendanceTaskAttributes,
  'id' | 'createdAt' | 'updatedAt'
>;

/**
 * 考勤任务模型接口
 */
export interface AttendanceTaskModel
  extends
    Model<AttendanceTaskAttributes, AttendanceTaskCreationAttributes>,
    AttendanceTaskAttributes {
  getClass: () => Promise<ClassModel>; // 添加获取班级的方法
}

/**
 * 考勤记录模型属性
 */
export interface AttendanceRecordAttributes {
  id: number;
  attendanceTaskId: number; // 根据文档应该是attendanceTaskId
  userId: number; // 根据文档应该是userId
  status: AttendanceStatus;
  remark?: string; // 添加remark字段
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 考勤记录模型创建属性
 */
export type AttendanceRecordCreationAttributes = Optional<
  AttendanceRecordAttributes,
  'id' | 'createdAt' | 'updatedAt'
>;

/**
 * 考勤记录模型接口
 */
export interface AttendanceRecordModel
  extends
    Model<AttendanceRecordAttributes, AttendanceRecordCreationAttributes>,
    AttendanceRecordAttributes {
  getAttendanceTask: () => Promise<AttendanceTaskModel>; // 修改方法名
  getUser: () => Promise<UserModel>; // 修改方法名
}

/**
 * 作业模型属性
 */
export interface HomeworkAttributes {
  id: number;
  classId: number; // 根据文档应该是classId而不是courseId
  title: string;
  content: string;
  deadline: Date;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 作业模型创建属性
 */
export type HomeworkCreationAttributes = Optional<
  HomeworkAttributes,
  'id' | 'createdAt' | 'updatedAt'
>;

/**
 * 作业模型接口
 */
export interface HomeworkModel
  extends Model<HomeworkAttributes, HomeworkCreationAttributes>, HomeworkAttributes {
  getClass: () => Promise<ClassModel>; // 添加获取班级的方法
  getSubmissions: () => Promise<HomeworkSubmissionModel[]>;
}

/**
 * 作业提交模型属性
 */
export interface HomeworkSubmissionAttributes {
  id: number;
  homeworkId: number;
  userId: number; // 根据文档应该是userId
  filePath: string;
  fileName?: string;
  content?: string;
  submitTime: Date;
  updatedAt: Date;
}

/**
 * 作业提交模型创建属性
 */
export type HomeworkSubmissionCreationAttributes = Optional<
  HomeworkSubmissionAttributes,
  'id' | 'updatedAt'
>;

/**
 * 作业提交模型接口
 */
export interface HomeworkSubmissionModel
  extends
    Model<HomeworkSubmissionAttributes, HomeworkSubmissionCreationAttributes>,
    HomeworkSubmissionAttributes {
  getUser: () => Promise<UserModel>; // 修改方法名
  getHomework: () => Promise<HomeworkModel>;
}

/**
 * 通知模型属性
 */
export interface NotificationAttributes {
  id: number;
  type: string; // 根据文档应该是string类型
  title: string;
  content: string;
  targetUserId: number; // 根据文档添加targetUserId
  senderId: number;
  status: string; // 根据文档应该是string类型
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 通知模型创建属性
 */
export type NotificationCreationAttributes = Optional<
  NotificationAttributes,
  'id' | 'createdAt' | 'updatedAt'
>;

/**
 * 通知模型接口
 */
export interface NotificationModel
  extends Model<NotificationAttributes, NotificationCreationAttributes>, NotificationAttributes {
  getSender: () => Promise<UserModel>;
  getTargetUser: () => Promise<UserModel>; // 添加获取目标用户的方法
}

/**
 * 权限模型属性
 */
export interface PermissionAttributes {
  id: number;
  name: string;
  description: string;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 权限模型创建属性
 */
export type PermissionCreationAttributes = Optional<
  PermissionAttributes,
  'id' | 'createdAt' | 'updatedAt'
>;

/**
 * 权限模型接口
 */
export interface PermissionModel
  extends Model<PermissionAttributes, PermissionCreationAttributes>, PermissionAttributes {
  getRoles: () => Promise<RoleModel[]>;
}

/**
 * 数据库模型集合接口
 */
export interface Models {
  User: ModelStatic<UserModel>;
  Role: ModelStatic<RoleModel>;
  Permission: ModelStatic<PermissionModel>;
  UserRole: ModelStatic<UserRoleModel>;
  Course: ModelStatic<CourseModel>;
  Teacher: ModelStatic<TeacherModel>;
  TimeSlot: ModelStatic<TimeSlotModel>;
  Class: ModelStatic<ClassModel>;
  AttendanceTask: ModelStatic<AttendanceTaskModel>;
  AttendanceRecord: ModelStatic<AttendanceRecordModel>;
  Homework: ModelStatic<HomeworkModel>;
  HomeworkSubmission: ModelStatic<HomeworkSubmissionModel>;
  Notification: ModelStatic<NotificationModel>;
  CourseTeacher: ModelStatic<CourseTeacherModel>;
  SubCourse: ModelStatic<SubCourseModel>;
  HomeworkFile: ModelStatic<HomeworkFileModel>;
}

/**
 * 数据库连接实例接口
 */
export interface DatabaseInstance {
  sequelize: Sequelize;
  models: Models;
  init: () => Promise<void>;
  close: () => Promise<void>;
  sync: (options?: { force?: boolean }) => Promise<void>;
}

// 课程教师关联模型
export interface CourseTeacherAttributes {
  courseId: number;
  teacherId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type CourseTeacherCreationAttributes = Optional<
  CourseTeacherAttributes,
  'createdAt' | 'updatedAt'
>;

export interface CourseTeacherModel
  extends
    Model<CourseTeacherAttributes, CourseTeacherCreationAttributes>,
    CourseTeacherAttributes {}

// 子课程模型
export interface SubCourseAttributes {
  id: number;
  courseId: number;
  subCourseCode: string;
  teacherId: number;
  academicYear: number;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}

export type SubCourseCreationAttributes = Optional<
  SubCourseAttributes,
  'id' | 'createdAt' | 'updatedAt'
>;

export interface SubCourseModel
  extends Model<SubCourseAttributes, SubCourseCreationAttributes>, SubCourseAttributes {}

// 作业文件模型
export interface HomeworkFileAttributes {
  id: number;
  submissionId: number;
  fileName: string;
  filePath: string;
  fileSize?: number;
  fileType?: string;
  uploadTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type HomeworkFileCreationAttributes = Optional<
  HomeworkFileAttributes,
  'id' | 'uploadTime' | 'createdAt' | 'updatedAt'
>;

export interface HomeworkFileModel
  extends Model<HomeworkFileAttributes, HomeworkFileCreationAttributes>, HomeworkFileAttributes {}
