// 后端服务层相关类型定义
import {
  Status,
  PaginationParams,
  PaginationResponse,
  User,
  Role,
  Permission,
  Course,
  Teacher,
  AttendanceTask,
  AttendanceRecord,
  Homework,
  HomeworkSubmission,
  Notification,
  LoginParams,
  LoginResponse,
} from '@csisp/types';

/**
 * 基础服务接口
 */
export interface BaseService<T, CreateDTO, UpdateDTO> {
  /**
   * 创建记录
   */
  create(data: CreateDTO): Promise<T>;

  /**
   * 根据ID获取记录
   */
  getById(id: number): Promise<T | null>;

  /**
   * 获取所有记录（支持分页）
   */
  getAll(params?: PaginationParams & Record<string, any>): Promise<PaginationResponse<T> | T[]>;

  /**
   * 更新记录
   */
  update(id: number, data: UpdateDTO): Promise<T | null>;

  /**
   * 删除记录（软删除）
   */
  delete(id: number): Promise<boolean>;

  /**
   * 批量删除记录（软删除）
   */
  batchDelete(ids: number[]): Promise<boolean>;

  /**
   * 启用/禁用记录
   */
  changeStatus(id: number, status: Status): Promise<boolean>;
}

/**
 * 认证服务接口
 */
export interface AuthService {
  /**
   * 用户登录
   */
  login(params: LoginParams): Promise<LoginResponse>;

  /**
   * 用户登出
   */
  logout(token: string): Promise<void>;

  /**
   * 刷新令牌
   */
  refreshToken(refreshToken: string): Promise<{ token: string }>;

  /**
   * 验证令牌
   */
  validateToken(token: string): Promise<{ userId: number; roles: number[] }>;

  /**
   * 修改密码
   */
  changePassword(userId: number, oldPassword: string, newPassword: string): Promise<boolean>;

  /**
   * 重置密码
   */
  resetPassword(userId: number, newPassword: string): Promise<boolean>;
}

/**
 * 用户服务接口
 */
export interface UserService extends BaseService<User, Partial<User>, Partial<User>> {
  /**
   * 根据用户名获取用户
   */
  getByUsername(username: string): Promise<User | null>;

  /**
   * 获取用户角色
   */
  getUserRoles(userId: number): Promise<Role[]>;

  /**
   * 分配用户角色
   */
  assignRoles(userId: number, roleIds: number[]): Promise<boolean>;

  /**
   * 获取用户权限
   */
  getUserPermissions(userId: number): Promise<Permission[]>;

  /**
   * 检查用户是否有指定权限
   */
  checkPermission(userId: number, permissionCode: string): Promise<boolean>;

  /**
   * 获取学生列表
   */
  getStudents(params?: PaginationParams & Record<string, any>): Promise<PaginationResponse<User>>;
}

/**
 * 角色服务接口
 */
export interface RoleService extends BaseService<Role, Partial<Role>, Partial<Role>> {
  /**
   * 获取角色权限
   */
  getRolePermissions(roleId: number): Promise<Permission[]>;

  /**
   * 分配角色权限
   */
  assignPermissions(roleId: number, permissionIds: number[]): Promise<boolean>;
}

/**
 * 课程服务接口
 */
export interface CourseService extends BaseService<Course, Partial<Course>, Partial<Course>> {
  /**
   * 获取课程教师
   */
  getCourseTeachers(courseId: number): Promise<Teacher[]>;

  /**
   * 分配课程教师
   */
  assignTeachers(courseId: number, teacherIds: number[]): Promise<boolean>;

  /**
   * 获取课程学生
   */
  getCourseStudents(courseId: number, params?: PaginationParams): Promise<PaginationResponse<User>>;

  /**
   * 获取学生课程列表
   */
  getStudentCourses(studentId: number): Promise<Course[]>;

  /**
   * 获取当前学期课程
   */
  getCurrentSemesterCourses(): Promise<Course[]>;
}

/**
 * 考勤服务接口
 */
export interface AttendanceService extends BaseService<
  AttendanceTask,
  Partial<AttendanceTask>,
  Partial<AttendanceTask>
> {
  /**
   * 创建考勤任务
   */
  createTask(data: Partial<AttendanceTask>): Promise<AttendanceTask>;

  /**
   * 学生打卡
   */
  checkIn(
    taskId: number,
    studentId: number,
    ip: string,
    deviceInfo: string
  ): Promise<AttendanceRecord>;

  /**
   * 获取考勤记录
   */
  getAttendanceRecords(
    taskId: number,
    params?: PaginationParams
  ): Promise<PaginationResponse<AttendanceRecord>>;

  /**
   * 获取学生考勤记录
   */
  getStudentAttendanceRecords(studentId: number, courseId?: number): Promise<AttendanceRecord[]>;

  /**
   * 获取考勤统计
   */
  getAttendanceStatistics(taskId: number): Promise<any>;

  /**
   * 获取课程考勤统计
   */
  getCourseAttendanceStatistics(courseId: number): Promise<any>;
}

/**
 * 作业服务接口
 */
export interface HomeworkService extends BaseService<
  Homework,
  Partial<Homework>,
  Partial<Homework>
> {
  /**
   * 发布作业
   */
  publishHomework(data: Partial<Homework>): Promise<Homework>;

  /**
   * 提交作业
   */
  submitHomework(
    homeworkId: number,
    studentId: number,
    filePath: string,
    content?: string
  ): Promise<HomeworkSubmission>;

  /**
   * 获取作业提交列表
   */
  getSubmissions(
    homeworkId: number,
    params?: PaginationParams
  ): Promise<PaginationResponse<HomeworkSubmission>>;

  /**
   * 获取学生作业提交
   */
  getStudentSubmission(homeworkId: number, studentId: number): Promise<HomeworkSubmission | null>;

  /**
   * 批改作业
   */
  gradeHomework(
    submissionId: number,
    score: number,
    comment: string,
    gradedBy: number
  ): Promise<boolean>;

  /**
   * 获取作业统计
   */
  getHomeworkStatistics(homeworkId: number): Promise<any>;
}

/**
 * 通知服务接口
 */
export interface NotificationService extends BaseService<
  Notification,
  Partial<Notification>,
  Partial<Notification>
> {
  /**
   * 发布通知
   */
  publishNotification(data: Partial<Notification>, targetUserIds?: number[]): Promise<Notification>;

  /**
   * 获取用户通知列表
   */
  getUserNotifications(
    userId: number,
    params?: PaginationParams
  ): Promise<PaginationResponse<Notification>>;

  /**
   * 标记通知为已读
   */
  markAsRead(notificationId: number, userId: number): Promise<boolean>;

  /**
   * 标记所有通知为已读
   */
  markAllAsRead(userId: number): Promise<boolean>;

  /**
   * 获取用户通知统计
   */
  getUserNotificationStats(userId: number): Promise<{ total: number; unread: number }>;

  /**
   * 推送实时通知
   */
  pushRealTimeNotification(notification: Notification, userIds: number[]): Promise<void>;
}

/**
 * 缓存服务接口
 */
export interface CacheService {
  /**
   * 设置缓存
   */
  set(key: string, value: any, ttl?: number): Promise<void>;

  /**
   * 获取缓存
   */
  get<T = any>(key: string): Promise<T | null>;

  /**
   * 删除缓存
   */
  delete(key: string): Promise<boolean>;

  /**
   * 清除匹配模式的缓存
   */
  clearPattern(pattern: string): Promise<void>;

  /**
   * 判断缓存是否存在
   */
  exists(key: string): Promise<boolean>;
}

/**
 * 文件服务接口
 */
export interface FileService {
  /**
   * 上传文件
   */
  uploadFile(
    file: any,
    options?: Record<string, any>
  ): Promise<{ filePath: string; fileName: string; fileSize: number }>;

  /**
   * 删除文件
   */
  deleteFile(filePath: string): Promise<boolean>;

  /**
   * 获取文件URL
   */
  getFileUrl(filePath: string): string;

  /**
   * 验证文件类型
   */
  validateFileType(fileName: string, allowedTypes: string[]): boolean;
}
