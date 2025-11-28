/**
 * 路由配置器
 * 统一管理所有控制器路由，提供自动化的路由注册功能
 */
import Router from '@koa/router';
import { testConnection } from '../database';
import { jwtAuth, requireAdmin } from '../middlewares/auth';
import { UserController } from './UserController';
import { CourseController } from './CourseController';
import { AttendanceController } from './AttendanceController';
import { HomeworkController } from './HomeworkController';
import { DashboardController } from './DashboardController';

/**
 * 路由配置类
 * 负责注册和管理所有API路由
 */
export class RouterConfig {
  private router: Router;
  private userController: UserController;
  private courseController: CourseController;
  private attendanceController: AttendanceController;
  private homeworkController: HomeworkController;
  private dashboardController: DashboardController;

  constructor(
    userController: UserController,
    courseController: CourseController,
    attendanceController: AttendanceController,
    homeworkController: HomeworkController,
    dashboardController: DashboardController
  ) {
    this.router = new Router({ prefix: '/api' });
    this.userController = userController;
    this.courseController = courseController;
    this.attendanceController = attendanceController;
    this.homeworkController = homeworkController;
    this.dashboardController = dashboardController;

    this.registerRoutes();
  }

  /**
   * 注册所有路由
   */
  private registerRoutes(): void {
    // 用户相关路由
    this.registerUserRoutes();

    // 课程相关路由
    this.registerCourseRoutes();

    // 考勤相关路由
    this.registerAttendanceRoutes();

    // 作业相关路由
    this.registerHomeworkRoutes();

    // 仪表盘相关路由
    this.registerDashboardRoutes();

    // 健康检查路由
    this.registerHealthRoutes();
  }

  /**
   * 注册用户相关路由
   */
  private registerUserRoutes(): void {
    // 用户认证
    this.router.post('/users/register', this.userController.register.bind(this.userController));
    this.router.post('/users/login', this.userController.login.bind(this.userController));
    this.router.get(
      '/users/me',
      jwtAuth(),
      this.userController.getCurrentUser.bind(this.userController)
    );

    // 用户管理
    this.router.get(
      '/users',
      jwtAuth(),
      requireAdmin,
      this.userController.getUsers.bind(this.userController)
    );
    this.router.get(
      '/users/:id',
      jwtAuth(),
      this.userController.getUserById.bind(this.userController)
    );
    this.router.get(
      '/users/student/:studentId',
      jwtAuth(),
      this.userController.getUserByStudentId.bind(this.userController)
    );
    this.router.put(
      '/users/:id',
      jwtAuth(),
      this.userController.updateUser.bind(this.userController)
    );

    // 批量操作
    this.router.post(
      '/users/bulk',
      jwtAuth(),
      requireAdmin,
      this.userController.bulkCreateUsers.bind(this.userController)
    );

    // 角色管理
    this.router.post(
      '/users/:id/roles',
      jwtAuth(),
      requireAdmin,
      this.userController.assignRoles.bind(this.userController)
    );
    this.router.get(
      '/users/:id/roles',
      jwtAuth(),
      this.userController.getUserRoles.bind(this.userController)
    );

    // 统计信息
    this.router.get(
      '/users/stats',
      jwtAuth(),
      requireAdmin,
      this.userController.getUserStats.bind(this.userController)
    );
  }

  /**
   * 注册课程相关路由
   */
  private registerCourseRoutes(): void {
    // 课程管理
    this.router.post('/courses', this.courseController.createCourse.bind(this.courseController));
    this.router.get('/courses', this.courseController.getCourses.bind(this.courseController));
    this.router.get(
      '/courses/:id',
      this.courseController.getCourseDetail.bind(this.courseController)
    );
    this.router.put(
      '/courses/:id/status',
      this.courseController.updateCourseStatus.bind(this.courseController)
    );

    // 教师分配
    this.router.post(
      '/courses/:id/teachers',
      this.courseController.assignTeachers.bind(this.courseController)
    );

    // 班级管理
    this.router.post(
      '/courses/classes',
      this.courseController.createClass.bind(this.courseController)
    );

    // 时间安排
    this.router.post(
      '/courses/time-slots',
      this.courseController.createTimeSlot.bind(this.courseController)
    );

    // 子课程管理
    this.router.post(
      '/courses/sub-courses',
      this.courseController.createSubCourse.bind(this.courseController)
    );

    // 学期课程
    this.router.get(
      '/courses/semester/:year/:semester',
      this.courseController.getCoursesBySemester.bind(this.courseController)
    );

    // 教师课程
    this.router.get(
      '/courses/teacher/:teacherId',
      this.courseController.getTeacherCourses.bind(this.courseController)
    );
  }

  /**
   * 注册考勤相关路由
   */
  private registerAttendanceRoutes(): void {
    // 考勤任务管理
    this.router.post(
      '/attendance/tasks',
      this.attendanceController.createAttendanceTask.bind(this.attendanceController)
    );
    this.router.get(
      '/attendance/tasks/class/:classId',
      this.attendanceController.getClassAttendanceTasks.bind(this.attendanceController)
    );
    this.router.get(
      '/attendance/tasks/active',
      this.attendanceController.getActiveAttendanceTasks.bind(this.attendanceController)
    );

    // 打卡功能
    this.router.post(
      '/attendance/checkin',
      this.attendanceController.checkIn.bind(this.attendanceController)
    );

    // 打卡记录
    this.router.get(
      '/attendance/tasks/:taskId/records',
      this.attendanceController.getAttendanceRecords.bind(this.attendanceController)
    );
    this.router.put(
      '/attendance/records/:recordId',
      this.attendanceController.updateAttendanceRecord.bind(this.attendanceController)
    );

    // 统计分析
    this.router.get(
      '/attendance/stats/student/:userId',
      this.attendanceController.getStudentAttendanceStats.bind(this.attendanceController)
    );
    this.router.get(
      '/attendance/stats/class/:classId',
      this.attendanceController.getClassAttendanceStats.bind(this.attendanceController)
    );
  }

  /**
   * 注册作业相关路由
   */
  private registerHomeworkRoutes(): void {
    // 作业管理
    this.router.post(
      '/homework',
      this.homeworkController.createHomework.bind(this.homeworkController)
    );
    this.router.get(
      '/homework/class/:classId',
      this.homeworkController.getClassHomeworks.bind(this.homeworkController)
    );
    this.router.get(
      '/homework/:homeworkId/submissions',
      this.homeworkController.getHomeworkSubmissions.bind(this.homeworkController)
    );
    this.router.get(
      '/homework/:homeworkId/stats',
      this.homeworkController.getHomeworkStats.bind(this.homeworkController)
    );
    this.router.put(
      '/homework/:homeworkId/status',
      this.homeworkController.updateHomeworkStatus.bind(this.homeworkController)
    );

    // 作业提交
    this.router.post(
      '/homework/submit',
      this.homeworkController.submitHomework.bind(this.homeworkController)
    );
    this.router.get(
      '/homework/student/:userId',
      this.homeworkController.getStudentSubmissions.bind(this.homeworkController)
    );

    // 作业批改
    this.router.put(
      '/homework/grade',
      this.homeworkController.gradeHomework.bind(this.homeworkController)
    );
  }

  /**
   * 注册仪表盘相关路由
   */
  private registerDashboardRoutes(): void {
    this.router.get(
      '/dashboard/stats',
      this.dashboardController.getStats.bind(this.dashboardController)
    );
    this.router.get(
      '/dashboard/user-growth',
      this.dashboardController.getUserGrowth.bind(this.dashboardController)
    );
    this.router.get(
      '/dashboard/course-distribution',
      this.dashboardController.getCourseDistribution.bind(this.dashboardController)
    );
    this.router.get(
      '/dashboard/recent-activities',
      this.dashboardController.getRecentActivities.bind(this.dashboardController)
    );
  }

  /**
   * 注册健康检查路由
   */
  private registerHealthRoutes(): void {
    /**
     * @swagger
     * /api/health:
     *   get:
     *     summary: 健康检查
     *     tags: [System]
     *     responses:
     *       200: { description: 服务健康状态 }
     */
    this.router.get('/health', (ctx: any) => {
      ctx.body = {
        code: 200,
        message: '服务正常运行',
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: process.version,
        },
      };
    });

    this.router.get('/db/health', async (ctx: any) => {
      const ok = await testConnection();
      ctx.body = ok
        ? { code: 200, message: '数据库连接正常' }
        : { code: 503, message: '数据库连接失败' };
      ctx.status = ok ? 200 : 503;
    });
  }

  /**
   * 获取路由实例
   * @returns 路由实例
   */
  getRouter(): Router {
    return this.router;
  }

  /**
   * 获取所有路由信息
   * @returns 路由信息数组
   */
  getRoutesInfo(): Array<{
    method: string;
    path: string;
    description: string;
  }> {
    return [
      // 用户相关路由
      { method: 'POST', path: '/api/users/register', description: '用户注册' },
      { method: 'POST', path: '/api/users/login', description: '用户登录' },
      { method: 'GET', path: '/api/users/me', description: '获取当前用户信息' },
      { method: 'GET', path: '/api/users', description: '获取用户列表' },
      { method: 'GET', path: '/api/users/:id', description: '根据ID获取用户信息' },
      { method: 'GET', path: '/api/users/student/:studentId', description: '根据学号获取用户信息' },
      { method: 'PUT', path: '/api/users/:id', description: '更新用户信息' },
      { method: 'POST', path: '/api/users/bulk', description: '批量创建用户' },
      { method: 'POST', path: '/api/users/:id/roles', description: '分配角色给用户' },
      { method: 'GET', path: '/api/users/:id/roles', description: '获取用户角色' },
      { method: 'GET', path: '/api/users/stats', description: '获取用户统计信息' },

      // 课程相关路由
      { method: 'POST', path: '/api/courses', description: '创建课程' },
      { method: 'GET', path: '/api/courses', description: '获取课程列表' },
      { method: 'GET', path: '/api/courses/:id', description: '获取课程详细信息' },
      { method: 'PUT', path: '/api/courses/:id/status', description: '更新课程状态' },
      { method: 'POST', path: '/api/courses/:id/teachers', description: '为课程分配教师' },
      { method: 'POST', path: '/api/courses/classes', description: '创建班级' },
      { method: 'POST', path: '/api/courses/time-slots', description: '创建时间段' },
      { method: 'POST', path: '/api/courses/sub-courses', description: '创建子课程' },
      {
        method: 'GET',
        path: '/api/courses/semester/:year/:semester',
        description: '获取指定学期的课程',
      },
      { method: 'GET', path: '/api/courses/teacher/:teacherId', description: '获取教师授课列表' },

      // 考勤相关路由
      { method: 'POST', path: '/api/attendance/tasks', description: '创建考勤任务' },
      {
        method: 'GET',
        path: '/api/attendance/tasks/class/:classId',
        description: '获取班级的考勤任务',
      },
      {
        method: 'GET',
        path: '/api/attendance/tasks/active',
        description: '获取当前活跃的考勤任务',
      },
      { method: 'POST', path: '/api/attendance/checkin', description: '学生打卡' },
      {
        method: 'GET',
        path: '/api/attendance/tasks/:taskId/records',
        description: '获取考勤任务的打卡记录',
      },
      { method: 'PUT', path: '/api/attendance/records/:recordId', description: '更新考勤记录' },
      {
        method: 'GET',
        path: '/api/attendance/stats/student/:userId',
        description: '获取学生的考勤统计',
      },
      {
        method: 'GET',
        path: '/api/attendance/stats/class/:classId',
        description: '获取班级的考勤统计',
      },

      // 作业相关路由
      { method: 'POST', path: '/api/homework', description: '发布作业' },
      { method: 'GET', path: '/api/homework/class/:classId', description: '获取班级的作业列表' },
      {
        method: 'GET',
        path: '/api/homework/:homeworkId/submissions',
        description: '获取作业的提交情况',
      },
      { method: 'GET', path: '/api/homework/:homeworkId/stats', description: '获取作业统计信息' },
      { method: 'PUT', path: '/api/homework/:homeworkId/status', description: '更新作业状态' },
      { method: 'POST', path: '/api/homework/submit', description: '提交作业' },
      {
        method: 'GET',
        path: '/api/homework/student/:userId',
        description: '获取学生的作业提交情况',
      },
      { method: 'PUT', path: '/api/homework/grade', description: '批改作业' },

      // 健康检查
      { method: 'GET', path: '/api/health', description: '健康检查' },

      // 仪表盘
      { method: 'GET', path: '/api/dashboard/stats', description: '仪表盘统计' },
      { method: 'GET', path: '/api/dashboard/user-growth', description: '用户增长' },
      { method: 'GET', path: '/api/dashboard/course-distribution', description: '课程分布' },
      { method: 'GET', path: '/api/dashboard/recent-activities', description: '最近活动' },
    ];
  }
}
