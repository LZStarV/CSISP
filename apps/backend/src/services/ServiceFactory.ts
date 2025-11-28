/**
 * 服务工厂类
 * 统一管理所有服务实例的创建和依赖注入
 */
import { UserService } from './UserService';
import { CourseService } from './CourseService';
import { AttendanceService } from './AttendanceService';
import { HomeworkService } from './HomeworkService';
import { DashboardService } from './DashboardService';

export class ServiceFactory {
  private static instance: ServiceFactory;
  private services: Map<string, any> = new Map();
  private models: Map<string, any> = new Map();

  private constructor() {}

  /**
   * 获取服务工厂单例实例
   * @returns 服务工厂实例
   */
  static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }

  /**
   * 注册模型
   * @param name 模型名称
   * @param model 模型实例
   */
  registerModel(name: string, model: any): void {
    this.models.set(name, model);
  }

  /**
   * 批量注册模型
   * @param models 模型对象
   */
  registerModels(models: Record<string, any>): void {
    Object.entries(models).forEach(([name, model]) => {
      this.registerModel(name, model);
    });
  }

  /**
   * 获取模型
   * @param name 模型名称
   * @returns 模型实例
   */
  getModel(name: string): any {
    const model = this.models.get(name);
    if (!model) {
      throw new Error(`Model ${name} not found. Please register it first.`);
    }
    return model;
  }

  /**
   * 获取用户服务
   * @returns 用户服务实例
   */
  getUserService(): UserService {
    if (!this.services.has('userService')) {
      const userService = new UserService(
        this.getModel('User'),
        this.getModel('UserRole'),
        this.getModel('Role')
      );
      this.services.set('userService', userService);
    }
    return this.services.get('userService');
  }

  /**
   * 获取课程服务
   * @returns 课程服务实例
   */
  getCourseService(): CourseService {
    if (!this.services.has('courseService')) {
      const courseService = new CourseService(
        this.getModel('Course'),
        this.getModel('CourseTeacher'),
        this.getModel('Teacher'),
        this.getModel('Class'),
        this.getModel('TimeSlot'),
        this.getModel('SubCourse')
      );
      this.services.set('courseService', courseService);
    }
    return this.services.get('courseService');
  }

  /**
   * 获取考勤服务
   * @returns 考勤服务实例
   */
  getAttendanceService(): AttendanceService {
    if (!this.services.has('attendanceService')) {
      const attendanceService = new AttendanceService(
        this.getModel('AttendanceTask'),
        this.getModel('AttendanceRecord'),
        this.getModel('Class'),
        this.getModel('User'),
        this.getModel('Course')
      );
      this.services.set('attendanceService', attendanceService);
    }
    return this.services.get('attendanceService');
  }

  /**
   * 获取作业服务
   * @returns 作业服务实例
   */
  getHomeworkService(): HomeworkService {
    if (!this.services.has('homeworkService')) {
      const homeworkService = new HomeworkService(
        this.getModel('Homework'),
        this.getModel('HomeworkSubmission'),
        this.getModel('HomeworkFile'),
        this.getModel('Class'),
        this.getModel('User')
      );
      this.services.set('homeworkService', homeworkService);
    }
    return this.services.get('homeworkService');
  }

  /**
   * 获取所有服务实例
   * @returns 服务实例映射
   */
  getAllServices(): Record<string, any> {
    return {
      userService: this.getUserService(),
      courseService: this.getCourseService(),
      attendanceService: this.getAttendanceService(),
      homeworkService: this.getHomeworkService(),
      dashboardService: this.getDashboardService(),
    };
  }

  /**
   * 清理服务实例
   */
  clearServices(): void {
    this.services.clear();
  }

  /**
   * 清理模型注册
   */
  clearModels(): void {
    this.models.clear();
  }

  /**
   * 重置工厂状态
   */
  reset(): void {
    this.clearServices();
    this.clearModels();
  }

  /** 获取仪表盘服务 */
  getDashboardService(): DashboardService {
    if (!this.services.has('dashboardService')) {
      const dashboardService = new DashboardService({
        User: this.getModel('User'),
        Course: this.getModel('Course'),
        Class: this.getModel('Class'),
        AttendanceRecord: this.getModel('AttendanceRecord'),
        Homework: this.getModel('Homework'),
        HomeworkSubmission: this.getModel('HomeworkSubmission'),
        Notification: this.getModel('Notification'),
      });
      this.services.set('dashboardService', dashboardService);
    }
    return this.services.get('dashboardService');
  }
}
