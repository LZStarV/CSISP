/**
 * 考勤控制器
 * 处理考勤相关的HTTP请求，包括考勤任务管理、打卡、统计等
 */
import { AttendanceService } from '../services/AttendanceService';
import { BaseController } from './BaseController';
import { CreateAttendanceTaskInput, AttendanceStatus } from '@csisp/types';
import { AppContext } from '../types/context';

export class AttendanceController extends BaseController {
  private attendanceService: AttendanceService;

  constructor(attendanceService: AttendanceService) {
    super();
    this.attendanceService = attendanceService;
  }

  /**
   * 创建考勤任务
   * POST /api/attendance/tasks
   * @param ctx Koa上下文
   */
  /**
   * @swagger
   * /api/attendance/tasks:
   *   post:
   *     summary: 创建考勤任务
   *     description: 为班级创建考勤任务，需指定时间范围与任务类型。
   *     tags: [Attendance]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/AttendanceTask'
   *     responses:
   *       201:
   *         description: 创建成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data: { $ref: '#/components/schemas/AttendanceTaskEntity' }
   *       400: { description: 参数错误 }
   */
  async createAttendanceTask(ctx: AppContext): Promise<void> {
    try {
      const taskData: CreateAttendanceTaskInput = ctx.request.body as CreateAttendanceTaskInput;

      // 验证必填参数
      const requiredParams = ['classId', 'taskName', 'taskType', 'startTime', 'endTime'];
      if (!this.validateRequiredParams(ctx, requiredParams, taskData)) {
        return;
      }

      const result = await this.attendanceService.createAttendanceTask(taskData);
      this.handleServiceResponse(ctx, result);
    } catch {
      this.serverError(ctx, '创建考勤任务失败');
    }
  }

  /**
   * 学生打卡
   * POST /api/attendance/checkin
   * @param ctx Koa上下文
   */
  /**
   * @swagger
   * /api/attendance/checkin:
   *   post:
   *     summary: 学生打卡
   *     description: 使用 JWT 获取当前用户，向目标任务打卡。
   *     tags: [Attendance]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: ['taskId']
   *             properties:
   *               taskId: { type: integer, minimum: 1 }
   *               status: { type: string }
   *               remark: { type: string }
   *     responses:
   *       200: { description: 打卡成功 }
   *       401: { description: 未登录 }
   *       400: { description: 参数错误 }
   */
  async checkIn(ctx: AppContext): Promise<void> {
    try {
      const { taskId, status, remark } = ctx.request.body as {
        taskId: number;
        status?: AttendanceStatus;
        remark?: string;
      };

      // 验证必填参数
      if (!taskId) {
        this.error(ctx, '考勤任务ID不能为空', 400);
        return;
      }

      // 获取当前用户ID
      const userId = ctx.userId || ctx.state.userId;
      if (!userId) {
        this.unauthorized(ctx, '未登录或登录已过期');
        return;
      }

      const result = await this.attendanceService.checkIn(taskId, userId, status, remark);
      this.handleServiceResponse(ctx, result);
    } catch {
      this.serverError(ctx, '打卡失败');
    }
  }

  /**
   * 获取班级的考勤任务
   * GET /api/attendance/tasks/class/:classId?page=1&size=10
   * @param ctx Koa上下文
   */
  /**
   * @swagger
   * /api/attendance/tasks/class/{classId}:
   *   get:
   *     summary: 获取班级的考勤任务（分页）
   *     description: 按班级 ID 查询任务列表；分页参数范围：page≥1，size∈[1,100]。
   *     tags: [Attendance]
   *     parameters:
   *       - in: path
   *         name: classId
   *         required: true
   *         schema: { type: integer, minimum: 1 }
   *       - in: query
   *         name: page
   *         schema: { type: integer, minimum: 1 }
   *       - in: query
   *         name: size
   *         schema: { type: integer, minimum: 1, maximum: 100 }
   *     responses:
   *       200:
   *         description: 成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data: { $ref: '#/components/schemas/PaginatedAttendanceTaskList' }
   */
  async getClassAttendanceTasks(ctx: AppContext): Promise<void> {
    try {
      const classId = parseInt(ctx.params.classId);
      if (isNaN(classId)) {
        this.error(ctx, '班级ID必须是数字', 400);
        return;
      }

      // 验证分页参数
      const pagination = this.validatePagination(ctx, ctx.query);

      const result = await this.attendanceService.getClassAttendanceTasks(classId, pagination);
      this.handleServiceResponse(ctx, result);
    } catch {
      this.serverError(ctx, '获取班级考勤任务失败');
    }
  }

  /**
   * 获取考勤任务的打卡记录
   * GET /api/attendance/tasks/:taskId/records?page=1&size=10
   * @param ctx Koa上下文
   */
  /**
   * @swagger
   * /api/attendance/tasks/{taskId}/records:
   *   get:
   *     summary: 获取考勤任务的打卡记录（分页）
   *     description: 按任务 ID 查询打卡记录；分页参数范围：page≥1，size∈[1,100]。
   *     tags: [Attendance]
   *     parameters:
   *       - in: path
   *         name: taskId
   *         required: true
   *         schema: { type: integer, minimum: 1 }
   *       - in: query
   *         name: page
   *         schema: { type: integer, minimum: 1 }
   *       - in: query
   *         name: size
   *         schema: { type: integer, minimum: 1, maximum: 100 }
   *     responses:
   *       200:
   *         description: 成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data: { $ref: '#/components/schemas/PaginatedAttendanceRecordList' }
   */
  async getAttendanceRecords(ctx: AppContext): Promise<void> {
    try {
      const taskId = parseInt(ctx.params.taskId);
      if (isNaN(taskId)) {
        this.error(ctx, '考勤任务ID必须是数字', 400);
        return;
      }

      // 验证分页参数
      const pagination = this.validatePagination(ctx, ctx.query);

      const result = await this.attendanceService.getAttendanceRecords(taskId, pagination);
      this.handleServiceResponse(ctx, result);
    } catch {
      this.serverError(ctx, '获取打卡记录失败');
    }
  }

  /**
   * 获取学生的考勤统计
   * GET /api/attendance/stats/student/:userId?classId=1
   * @param ctx Koa上下文
   */
  /**
   * @swagger
   * /api/attendance/stats/student/{userId}:
   *   get:
   *     summary: 获取学生的考勤统计
   *     description: 支持可选班级筛选，返回聚合统计信息。
   *     tags: [Attendance]
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema: { type: integer, minimum: 1 }
   *       - in: query
   *         name: classId
   *         schema: { type: integer, minimum: 1 }
   *     responses:
   *       200: { description: 成功 }
   *       400: { description: 参数错误 }
   */
  async getStudentAttendanceStats(ctx: AppContext): Promise<void> {
    try {
      const userId = parseInt(ctx.params.userId);
      if (isNaN(userId)) {
        this.error(ctx, '用户ID必须是数字', 400);
        return;
      }

      const classId = ctx.query.classId ? parseInt(ctx.query.classId as string) : undefined;
      if (classId && isNaN(classId)) {
        this.error(ctx, '班级ID必须是数字', 400);
        return;
      }

      const result = await this.attendanceService.getStudentAttendanceStats(userId, classId);
      this.handleServiceResponse(ctx, result);
    } catch {
      this.serverError(ctx, '获取学生考勤统计失败');
    }
  }

  /**
   * 获取班级的考勤统计
   * GET /api/attendance/stats/class/:classId
   * @param ctx Koa上下文
   */
  /**
   * @swagger
   * /api/attendance/stats/class/{classId}:
   *   get:
   *     summary: 获取班级的考勤统计
   *     description: 返回班级在特定时间段内的考勤聚合（视实现而定）。
   *     tags: [Attendance]
   *     parameters:
   *       - in: path
   *         name: classId
   *         required: true
   *         schema: { type: integer, minimum: 1 }
   *     responses:
   *       200: { description: 成功 }
   *       400: { description: 参数错误 }
   */
  async getClassAttendanceStats(ctx: AppContext): Promise<void> {
    try {
      const classId = parseInt(ctx.params.classId);
      if (isNaN(classId)) {
        this.error(ctx, '班级ID必须是数字', 400);
        return;
      }

      const result = await this.attendanceService.getClassAttendanceStats(classId);
      this.handleServiceResponse(ctx, result);
    } catch {
      this.serverError(ctx, '获取班级考勤统计失败');
    }
  }

  /**
   * 更新考勤记录
   * PUT /api/attendance/records/:recordId
   * @param ctx Koa上下文
   */
  /**
   * @swagger
   * /api/attendance/records/{recordId}:
   *   put:
   *     summary: 更新考勤记录
   *     description: 至少提供 status 或 remark 其中一项进行更新。
   *     tags: [Attendance]
   *     parameters:
   *       - in: path
   *         name: recordId
   *         required: true
   *         schema: { type: integer, minimum: 1 }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               status: { type: string }
   *               remark: { type: string }
   *     responses:
   *       200: { description: 更新成功 }
   *       400: { description: 参数错误 }
   */
  async updateAttendanceRecord(ctx: AppContext): Promise<void> {
    try {
      const recordId = parseInt(ctx.params.recordId);
      if (isNaN(recordId)) {
        this.error(ctx, '记录ID必须是数字', 400);
        return;
      }

      const { status, remark } = ctx.request.body as {
        status?: AttendanceStatus;
        remark?: string;
      };

      if (!status && !remark) {
        this.error(ctx, '必须提供状态或备注', 400);
        return;
      }

      const updateData: any = {};
      if (status) updateData.status = status;
      if (remark !== undefined) updateData.remark = remark;

      const result = await this.attendanceService.updateAttendanceRecord(recordId, updateData);
      this.handleServiceResponse(ctx, result);
    } catch {
      this.serverError(ctx, '更新考勤记录失败');
    }
  }

  /**
   * 获取当前活跃的考勤任务
   * GET /api/attendance/tasks/active?classId=1
   * @param ctx Koa上下文
   */
  /**
   * @swagger
   * /api/attendance/tasks/active:
   *   get:
   *     summary: 获取当前活跃的考勤任务
   *     description: 可选按班级过滤，返回当前时间窗口内处于激活状态的任务。
   *     tags: [Attendance]
   *     parameters:
   *       - in: query
   *         name: classId
   *         schema: { type: integer, minimum: 1 }
   *     responses:
   *       200: { description: 成功 }
   */
  async getActiveAttendanceTasks(ctx: AppContext): Promise<void> {
    try {
      const classId = ctx.query.classId ? parseInt(ctx.query.classId as string) : undefined;
      if (classId && isNaN(classId)) {
        this.error(ctx, '班级ID必须是数字', 400);
        return;
      }

      const result = await this.attendanceService.getActiveAttendanceTasks(classId);
      this.handleServiceResponse(ctx, result);
    } catch {
      this.serverError(ctx, '获取活跃考勤任务失败');
    }
  }

  /**
   * 获取活跃考勤任务（别名）
   */
  async getActiveTasks(ctx: AppContext): Promise<void> {
    await this.getActiveAttendanceTasks(ctx);
  }

  /**
   * 获取学生打卡记录（占位实现）
   */
  async getStudentAttendanceRecords(ctx: AppContext): Promise<void> {
    this.error(ctx, '暂不支持该查询', 400);
  }

  /**
   * 批量更新考勤记录（占位实现）
   */
  async batchUpdateAttendanceRecords(ctx: AppContext): Promise<void> {
    this.error(ctx, '暂不支持批量更新', 400);
  }

  /**
   * 导出考勤数据（占位实现）
   */
  async exportAttendanceData(ctx: AppContext): Promise<void> {
    this.error(ctx, '暂不支持数据导出', 400);
  }
}
