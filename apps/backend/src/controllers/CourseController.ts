/**
 * 课程控制器
 * 处理课程相关的HTTP请求，包括课程管理、班级管理、时间安排等
 */
import { CourseService } from '../services/CourseService';
import { BaseController } from './BaseController';
import {
  CreateCourseInput,
  CreateClassInput,
  CreateTimeSlotInput,
  CreateSubCourseInput,
  Status,
} from '@csisp/types';
import { AppContext } from '../types/context';

export class CourseController extends BaseController {
  private courseService: CourseService;

  constructor(courseService: CourseService) {
    super();
    this.courseService = courseService;
  }

  /**
   * 创建课程
   * POST /api/courses
   * @param ctx Koa上下文
   */
  /**
   * @swagger
   * /api/courses:
   *   post:
   *     summary: 创建课程
   *     description: 创建课程并配置学期、学年与可选专业列表；课程代码在同一学年同一学期应唯一。
   *     tags: [Courses]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateCourseInput'
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
   *                     data: { $ref: '#/components/schemas/Course' }
   *       400: { description: 参数错误 }
   */
  async createCourse(ctx: AppContext): Promise<void> {
    try {
      const courseData: CreateCourseInput = ctx.request.body as CreateCourseInput;

      // 验证必填参数
      const requiredParams = [
        'courseName',
        'courseCode',
        'semester',
        'academicYear',
        'availableMajors',
      ];
      if (!this.validateRequiredParams(ctx, requiredParams, courseData)) {
        return;
      }

      const result = await this.courseService.createCourse(courseData);
      this.handleServiceResponse(ctx, result);
    } catch {
      this.serverError(ctx, '创建课程失败');
    }
  }

  /**
   * 为课程分配教师
   * POST /api/courses/:id/teachers
   * @param ctx Koa上下文
   */
  /**
   * @swagger
   * /api/courses/{id}/teachers:
   *   post:
   *     summary: 为课程分配教师
   *     description: 支持一次分配 1-10 位教师，若重复将覆盖原有关系。
   *     tags: [Courses]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: integer, minimum: 1 }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               teacherIds:
   *                 type: array
   *                 items: { type: integer }
   *     responses:
   *       200: { description: 分配成功 }
   *       400: { description: 参数错误 }
   */
  async assignTeachers(ctx: AppContext): Promise<void> {
    try {
      const courseId = parseInt(ctx.params.id);
      if (isNaN(courseId)) {
        this.error(ctx, '课程ID必须是数字', 400);
        return;
      }

      const { teacherIds } = ctx.request.body as { teacherIds: number[] };

      if (!Array.isArray(teacherIds)) {
        this.error(ctx, '教师ID必须是数组', 400);
        return;
      }

      if (teacherIds.length === 0) {
        this.error(ctx, '至少需要分配一个教师', 400);
        return;
      }

      if (teacherIds.length > 10) {
        this.error(ctx, '最多分配10个教师', 400);
        return;
      }

      const result = await this.courseService.assignTeachers(courseId, teacherIds);
      this.handleServiceResponse(ctx, result);
    } catch {
      this.serverError(ctx, '分配教师失败');
    }
  }

  /**
   * 创建班级
   * POST /api/courses/classes
   * @param ctx Koa上下文
   */
  /**
   * @swagger
   * /api/courses/classes:
   *   post:
   *     summary: 创建班级
   *     description: 创建课程班级，需指定课程、教师、学期、学年与人数上限。
   *     tags: [Courses]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateClassInput'
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
   *                     data: { $ref: '#/components/schemas/Class' }
   *       400: { description: 参数错误 }
   */
  async createClass(ctx: AppContext): Promise<void> {
    try {
      const classData: CreateClassInput = ctx.request.body as CreateClassInput;

      // 验证必填参数
      const requiredParams = [
        'className',
        'courseId',
        'teacherId',
        'semester',
        'academicYear',
        'maxStudents',
      ];
      if (!this.validateRequiredParams(ctx, requiredParams, classData)) {
        return;
      }

      const result = await this.courseService.createClass(classData);
      this.handleServiceResponse(ctx, result);
    } catch {
      this.serverError(ctx, '创建班级失败');
    }
  }

  /**
   * 创建时间段
   * POST /api/courses/time-slots
   * @param ctx Koa上下文
   */
  /**
   * @swagger
   * /api/courses/time-slots:
   *   post:
   *     summary: 创建时间段
   *     description: 为子课程创建具体的上课时间与地点。
   *     tags: [Courses]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateTimeSlotInput'
   *     responses:
   *       201: { description: 创建成功 }
   *       400: { description: 参数错误 }
   */
  async createTimeSlot(ctx: AppContext): Promise<void> {
    try {
      const timeSlotData: CreateTimeSlotInput = ctx.request.body as CreateTimeSlotInput;

      // 验证必填参数
      const requiredParams = ['subCourseId', 'weekday', 'startTime', 'endTime', 'location'];
      if (!this.validateRequiredParams(ctx, requiredParams, timeSlotData)) {
        return;
      }

      const result = await this.courseService.createTimeSlot(timeSlotData);
      this.handleServiceResponse(ctx, result);
    } catch {
      this.serverError(ctx, '创建时间段失败');
    }
  }

  /**
   * 创建子课程
   * POST /api/courses/sub-courses
   * @param ctx Koa上下文
   */
  /**
   * @swagger
   * /api/courses/sub-courses:
   *   post:
   *     summary: 创建子课程
   *     description: 子课程代表具体的教学实施单元，与课程形成一对多关系。
   *     tags: [Courses]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateSubCourseInput'
   *     responses:
   *       201: { description: 创建成功 }
   *       400: { description: 参数错误 }
   */
  async createSubCourse(ctx: AppContext): Promise<void> {
    try {
      const subCourseData: CreateSubCourseInput = ctx.request.body as CreateSubCourseInput;

      // 验证必填参数
      const requiredParams = ['courseId', 'subCourseCode', 'teacherId', 'academicYear'];
      if (!this.validateRequiredParams(ctx, requiredParams, subCourseData)) {
        return;
      }

      const result = await this.courseService.createSubCourse(subCourseData);
      this.handleServiceResponse(ctx, result);
    } catch {
      this.serverError(ctx, '创建子课程失败');
    }
  }

  /**
   * 获取课程列表（支持专业筛选）
   * GET /api/courses?major=计算机科学&semester=1&page=1&size=10
   * @param ctx Koa上下文
   */
  /**
   * @swagger
   * /api/courses:
   *   get:
   *     summary: 获取课程列表（分页）
   *     description: 可按专业与学期筛选；分页参数范围：page≥1，size∈[1,100]。
   *     tags: [Courses]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema: { type: integer, minimum: 1 }
   *       - in: query
   *         name: size
   *         schema: { type: integer, minimum: 1, maximum: 100 }
   *       - in: query
   *         name: major
   *         schema: { type: string }
   *       - in: query
   *         name: semester
   *         schema: { type: integer, minimum: 1, maximum: 8 }
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
   *                     data: { $ref: '#/components/schemas/PaginatedCourseList' }
   */
  async getCourses(ctx: AppContext): Promise<void> {
    try {
      // 验证分页参数
      const pagination = this.validatePagination(ctx, ctx.query);

      const { major, semester } = ctx.query;

      const result = await this.courseService.getCoursesByMajor(
        pagination,
        major as string,
        semester ? parseInt(semester as string) : undefined
      );

      this.handleServiceResponse(ctx, result);
    } catch {
      this.serverError(ctx, '获取课程列表失败');
    }
  }

  /**
   * 获取课程详细信息
   * GET /api/courses/:id
   * @param ctx Koa上下文
   */
  /**
   * @swagger
   * /api/courses/{id}:
   *   get:
   *     summary: 获取课程详细信息
   *     description: 返回课程基本信息与关联详情（视实现而定）。
   *     tags: [Courses]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: integer, minimum: 1 }
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
   *                     data: { $ref: '#/components/schemas/Course' }
   *       400: { description: 参数错误 }
   *       404: { description: 未找到 }
   */
  async getCourseDetail(ctx: AppContext): Promise<void> {
    try {
      const courseId = parseInt(ctx.params.id);
      if (isNaN(courseId)) {
        this.error(ctx, '课程ID必须是数字', 400);
        return;
      }

      const result = await this.courseService.getCourseDetail(courseId);
      this.handleServiceResponse(ctx, result);
    } catch {
      this.serverError(ctx, '获取课程详情失败');
    }
  }

  /**
   * 获取课程教师列表
   */
  async getCourseTeachers(ctx: AppContext): Promise<void> {
    const courseId = parseInt(ctx.params.id);
    if (isNaN(courseId)) {
      this.error(ctx, '课程ID必须是数字', 400);
      return;
    }
    const detail = await this.courseService.getCourseDetail(courseId);
    if (detail.code !== 200) {
      this.handleServiceResponse(ctx, detail);
      return;
    }
    this.success(ctx, (detail.data as any)?.Teachers || [], '获取课程教师成功');
  }

  /**
   * 获取课程班级列表
   */
  async getCourseClasses(ctx: AppContext): Promise<void> {
    const courseId = parseInt(ctx.params.id);
    if (isNaN(courseId)) {
      this.error(ctx, '课程ID必须是数字', 400);
      return;
    }
    const detail = await this.courseService.getCourseDetail(courseId);
    if (detail.code !== 200) {
      this.handleServiceResponse(ctx, detail);
      return;
    }
    this.success(ctx, (detail.data as any)?.Classes || [], '获取课程班级成功');
  }

  /**
   * 获取班级详细信息
   */
  async getClassDetail(ctx: AppContext): Promise<void> {
    const classId = parseInt(ctx.params.classId);
    if (isNaN(classId)) {
      this.error(ctx, '班级ID必须是数字', 400);
      return;
    }
    const classModel = (this.courseService as any).classModel;
    const classInstance = await classModel.findByPk(classId);
    if (!classInstance) {
      this.error(ctx, '班级不存在', 404);
      return;
    }
    this.success(ctx, classInstance, '获取班级详情成功');
  }

  /**
   * 获取班级学生列表
   */
  async getClassStudents(ctx: AppContext): Promise<void> {
    const classId = parseInt(ctx.params.classId);
    if (isNaN(classId)) {
      this.error(ctx, '班级ID必须是数字', 400);
      return;
    }
    const classModel = (this.courseService as any).classModel;
    const students = await classModel.findByPk(classId, {
      include: [{ model: (this.courseService as any).userModel, through: { attributes: [] } }],
    });
    this.success(ctx, (students as any)?.Users || [], '获取班级学生成功');
  }

  /**
   * 获取指定学期的课程
   * GET /api/courses/semester/:year/:semester
   * @param ctx Koa上下文
   */
  /**
   * @swagger
   * /api/courses/semester/{year}/{semester}:
   *   get:
   *     summary: 获取指定学期的课程
   *     description: 学期范围 1-8；year 为学年；用于按时间维度查询课程。
   *     tags: [Courses]
   *     parameters:
   *       - in: path
   *         name: year
   *         required: true
   *         schema: { type: integer }
   *       - in: path
   *         name: semester
   *         required: true
   *         schema: { type: integer, minimum: 1, maximum: 8 }
   *     responses:
   *       200: { description: 成功 }
   *       400: { description: 参数错误 }
   */
  async getCoursesBySemester(ctx: AppContext): Promise<void> {
    try {
      const academicYear = parseInt(ctx.params.year);
      const semester = parseInt(ctx.params.semester);

      if (isNaN(academicYear) || isNaN(semester)) {
        this.error(ctx, '学年和学期必须是数字', 400);
        return;
      }

      if (semester < 1 || semester > 8) {
        this.error(ctx, '学期必须在1-8之间', 400);
        return;
      }

      const result = await this.courseService.getCoursesBySemester(academicYear, semester);
      this.handleServiceResponse(ctx, result);
    } catch {
      this.serverError(ctx, '获取学期课程失败');
    }
  }

  /**
   * 获取教师授课列表
   * GET /api/courses/teacher/:teacherId?page=1&size=10
   * @param ctx Koa上下文
   */
  /**
   * @swagger
   * /api/courses/teacher/{teacherId}:
   *   get:
   *     summary: 获取教师授课列表（分页）
   *     description: 按教师ID查询授课课程，支持分页。
   *     tags: [Courses]
   *     parameters:
   *       - in: path
   *         name: teacherId
   *         required: true
   *         schema: { type: integer, minimum: 1 }
   *       - in: query
   *         name: page
   *         schema: { type: integer, minimum: 1 }
   *       - in: query
   *         name: size
   *         schema: { type: integer, minimum: 1, maximum: 100 }
   *     responses:
   *       200: { description: 成功 }
   *       400: { description: 参数错误 }
   */
  async getTeacherCourses(ctx: AppContext): Promise<void> {
    try {
      const teacherId = parseInt(ctx.params.teacherId);
      if (isNaN(teacherId)) {
        this.error(ctx, '教师ID必须是数字', 400);
        return;
      }

      // 验证分页参数
      const pagination = this.validatePagination(ctx, ctx.query);

      const result = await this.courseService.getTeacherCourses(teacherId, pagination);
      this.handleServiceResponse(ctx, result);
    } catch {
      this.serverError(ctx, '获取教师课程失败');
    }
  }

  /**
   * 更新课程状态
   * PUT /api/courses/:id/status
   * @param ctx Koa上下文
   */
  /**
   * @swagger
   * /api/courses/{id}/status:
   *   put:
   *     summary: 更新课程状态
   *     description: 课程状态枚举：0 禁用，1 启用。
   *     tags: [Courses]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: integer, minimum: 1 }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               status: { $ref: '#/components/schemas/Status' }
   *     responses:
   *       200: { description: 更新成功 }
   *       400: { description: 参数错误 }
   */
  async updateCourseStatus(ctx: AppContext): Promise<void> {
    try {
      const courseId = parseInt(ctx.params.id);
      if (isNaN(courseId)) {
        this.error(ctx, '课程ID必须是数字', 400);
        return;
      }

      const { status } = ctx.request.body as { status: Status };

      if (status !== Status.Active && status !== Status.Inactive) {
        this.error(ctx, '状态必须是0(禁用)或1(启用)', 400);
        return;
      }

      const result = await this.courseService.updateCourseStatus(courseId, status);
      this.handleServiceResponse(ctx, result);
    } catch {
      this.serverError(ctx, '更新课程状态失败');
    }
  }
}
