/**
 * 用户控制器
 * 处理用户相关的HTTP请求，包括注册、登录、用户管理等
 */
import { AppContext } from '../types/context';
import { UserService } from '../services/UserService';
import { BaseController } from './BaseController';
import { CreateUserInput, UpdateUserInput, LoginParams } from '@csisp/types';

export class UserController extends BaseController {
  private userService: UserService;

  constructor(userService: UserService) {
    super();
    this.userService = userService;
  }

  /**
   * 用户注册
   * POST /api/users/register
   * @param ctx Koa上下文
   */
  /**
   * @swagger
   * /api/users/register:
   *   post:
   *     summary: 用户注册
   *     description: 创建一个新的学生用户。用户名与学号均需唯一，密码会进行加密存储。
   *     tags: [Users]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateUserInput'
   *           examples:
   *             default:
   *               value:
   *                 username: student001
   *                 password: P@ssw0rd123
   *                 realName: 张三
   *                 studentId: 20250102001
   *                 enrollmentYear: 2025
   *                 major: 计算机科学与技术
   *     responses:
   *       201:
   *         description: 用户注册成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/User'
   *       409:
   *         description: 用户名或学号已存在
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/ErrorResponse' }
   *       400:
   *         description: 参数错误
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/ErrorResponse' }
   */
  async register(ctx: AppContext): Promise<void> {
    try {
      const userData: CreateUserInput = ctx.request.body as CreateUserInput;

      // 验证必填参数
      const requiredParams = [
        'username',
        'password',
        'realName',
        'studentId',
        'enrollmentYear',
        'major',
      ];
      if (!this.validateRequiredParams(ctx, requiredParams, userData)) {
        return;
      }

      const result = await this.userService.register(userData);
      this.handleServiceResponse(ctx, result);
    } catch {
      this.serverError(ctx, '用户注册失败');
    }
  }

  /**
   * 用户登录
   * POST /api/users/login
   * @param ctx Koa上下文
   */
  /**
   * @swagger
   * /api/users/login:
   *   post:
   *     summary: 用户登录
   *     description: 使用用户名与密码登录，返回 JWT 令牌与用户角色信息。
   *     tags: [Users]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginParams'
   *           examples:
   *             default:
   *               value: { username: student001, password: P@ssw0rd123 }
   *     responses:
   *       200:
   *         description: 登录成功，返回令牌与用户信息
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: object
   *                       properties:
   *                         token: { type: string }
   *                         user: { $ref: '#/components/schemas/User' }
   *                         roles:
   *                           type: array
   *                           items: { $ref: '#/components/schemas/Role' }
   *       401:
   *         description: 用户名或密码错误
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/ErrorResponse' }
   */
  async login(ctx: AppContext): Promise<void> {
    try {
      const loginData: LoginParams = ctx.request.body as LoginParams;

      // 验证必填参数
      const requiredParams = ['username', 'password'];
      if (!this.validateRequiredParams(ctx, requiredParams, loginData)) {
        return;
      }

      const result = await this.userService.login(loginData);
      this.handleServiceResponse(ctx, result);
    } catch {
      this.serverError(ctx, '用户登录失败');
    }
  }

  /**
   * 获取当前用户信息
   * GET /api/users/me
   * @param ctx Koa上下文
   */
  /**
   * @swagger
   * /api/users/me:
   *   get:
   *     summary: 获取当前用户信息
   *     description: 通过 Authorization Bearer JWT 获取当前登录用户的详细信息。
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
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
   *                     data: { $ref: '#/components/schemas/User' }
   *       401:
   *         description: 未登录或登录已过期
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/ErrorResponse' }
   */
  async getCurrentUser(ctx: AppContext): Promise<void> {
    try {
      // 从JWT中间件获取用户信息
      const userId = ctx.userId || ctx.state.userId;
      if (!userId) {
        this.unauthorized(ctx, '未登录或登录已过期');
        return;
      }

      const result = await this.userService.findById(userId);
      this.handleServiceResponse(ctx, result);
    } catch {
      this.serverError(ctx, '获取用户信息失败');
    }
  }

  /**
   * 根据ID获取用户信息
   * GET /api/users/:id
   * @param ctx Koa上下文
   */
  /**
   * @swagger
   * /api/users/{id}:
   *   get:
   *     summary: 根据ID获取用户信息
   *     description: 通过用户ID查询用户详情，ID需为正整数。
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: 用户ID
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
   *                     data: { $ref: '#/components/schemas/User' }
   *       400:
   *         description: 参数错误
   *       404:
   *         description: 未找到
   */
  async getUserById(ctx: AppContext): Promise<void> {
    try {
      const userId = parseInt(ctx.params.id);
      if (isNaN(userId)) {
        this.error(ctx, '用户ID必须是数字', 400);
        return;
      }

      const result = await this.userService.findById(userId);
      this.handleServiceResponse(ctx, result);
    } catch {
      this.serverError(ctx, '获取用户信息失败');
    }
  }

  /**
   * 根据学号获取用户信息
   * GET /api/users/student/:studentId
   * @param ctx Koa上下文
   */
  /**
   * @swagger
   * /api/users/student/{studentId}:
   *   get:
   *     summary: 根据学号获取用户信息
   *     description: 学号为 11 位字符串，需存在且唯一。
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: studentId
   *         required: true
   *         schema:
   *           type: string
   *           minLength: 1
   *         description: 学号
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
   *                     data: { $ref: '#/components/schemas/User' }
   *       400: { description: 参数错误 }
   *       404: { description: 未找到 }
   */
  async getUserByStudentId(ctx: AppContext): Promise<void> {
    try {
      const studentId = ctx.params.studentId;
      if (!studentId) {
        this.error(ctx, '学号不能为空', 400);
        return;
      }

      const result = await this.userService.findByStudentId(studentId);
      this.handleServiceResponse(ctx, result);
    } catch {
      this.serverError(ctx, '获取用户信息失败');
    }
  }

  /**
   * 更新用户信息
   * PUT /api/users/:id
   * @param ctx Koa上下文
   */
  /**
   * @swagger
   * /api/users/{id}:
   *   put:
   *     summary: 更新用户信息
   *     description: 允许更新的字段：realName、email、phone、major、status。
   *     tags: [Users]
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
   *               realName: { type: string }
   *               email: { type: string }
   *               phone: { type: string }
   *               major: { type: string }
   *               status: { $ref: '#/components/schemas/Status' }
   *     responses:
   *       200:
   *         description: 更新成功
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/ApiResponse' }
   *       400: { description: 参数错误 }
   */
  async updateUser(ctx: AppContext): Promise<void> {
    try {
      const userId = parseInt(ctx.params.id);
      if (isNaN(userId)) {
        this.error(ctx, '用户ID必须是数字', 400);
        return;
      }

      const updateData: UpdateUserInput = ctx.request.body as UpdateUserInput;

      // 验证只能更新允许字段
      const allowedFields = ['realName', 'email', 'phone', 'major', 'status'];
      const updateFields = Object.keys(updateData);
      const invalidFields = updateFields.filter(field => !allowedFields.includes(field));

      if (invalidFields.length > 0) {
        this.error(ctx, `不允许更新的字段: ${invalidFields.join(', ')}`, 400);
        return;
      }

      const result = await this.userService.update(userId, updateData);
      this.handleServiceResponse(ctx, result);
    } catch {
      this.serverError(ctx, '更新用户信息失败');
    }
  }

  /**
   * 获取用户列表（分页）
   * GET /api/users?page=1&size=10&major=计算机科学&enrollmentYear=2023
   * @param ctx Koa上下文
   */
  /**
   * @swagger
   * /api/users:
   *   get:
   *     summary: 获取用户列表（分页）
   *     description: 支持按专业、入学年份、状态筛选；分页参数范围：page≥1，size∈[1,100]。
   *     tags: [Users]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema: { type: integer, minimum: 1 }
   *         description: 页码
   *       - in: query
   *         name: size
   *         schema: { type: integer, minimum: 1, maximum: 100 }
   *         description: 每页数量
   *       - in: query
   *         name: major
   *         schema: { type: string }
   *         description: 专业名称
   *       - in: query
   *         name: enrollmentYear
   *         schema: { type: integer, minimum: 2000, maximum: 3000 }
   *         description: 入学年份
   *       - in: query
   *         name: status
   *         schema: { $ref: '#/components/schemas/Status' }
   *         description: 用户状态
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
   *                     data: { $ref: '#/components/schemas/PaginatedUserList' }
   */
  async getUsers(ctx: AppContext): Promise<void> {
    try {
      // 验证分页参数
      const pagination = this.validatePagination(ctx, ctx.query);

      // 构建查询条件
      const { major, enrollmentYear, status } = ctx.query;
      const where: any = {};

      if (major) where.major = major;
      if (enrollmentYear) where.enrollmentYear = parseInt(enrollmentYear as string);
      if (status !== undefined) where.status = parseInt(status as string);

      const result = await this.userService.findAllWithPagination(pagination, where);
      this.handleServiceResponse(ctx, result);
    } catch {
      this.serverError(ctx, '获取用户列表失败');
    }
  }

  /**
   * 批量创建用户
   * POST /api/users/bulk
   * @param ctx Koa上下文
   */
  /**
   * @swagger
   * /api/users/bulk:
   *   post:
   *     summary: 批量创建用户（最多100条）
   *     description: 接收用户数组，进行必要字段校验后批量创建。
   *     tags: [Users]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: array
   *             items:
   *               $ref: '#/components/schemas/CreateUserInput'
   *     responses:
   *       201:
   *         description: 创建成功
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/ApiResponse' }
   *       400: { description: 参数错误 }
   */
  async bulkCreateUsers(ctx: AppContext): Promise<void> {
    try {
      const usersData: CreateUserInput[] = ctx.request.body as CreateUserInput[];

      if (!Array.isArray(usersData) || usersData.length === 0) {
        this.error(ctx, '用户数据必须是数组且不能为空', 400);
        return;
      }

      if (usersData.length > 100) {
        this.error(ctx, '一次最多创建100个用户', 400);
        return;
      }

      // 验证每个用户数据的必填字段
      for (let i = 0; i < usersData.length; i++) {
        const user = usersData[i];
        const requiredParams = [
          'username',
          'password',
          'realName',
          'studentId',
          'enrollmentYear',
          'major',
        ];
        const missingParams = requiredParams.filter(param => !user[param as keyof CreateUserInput]);

        if (missingParams.length > 0) {
          this.error(ctx, `第${i + 1}个用户缺少必填字段: ${missingParams.join(', ')}`, 400);
          return;
        }
      }

      const result = await this.userService.bulkCreate(usersData);
      this.handleServiceResponse(ctx, result);
    } catch {
      this.serverError(ctx, '批量创建用户失败');
    }
  }

  /**
   * 分配角色给用户
   * POST /api/users/:id/roles
   * @param ctx Koa上下文
   */
  /**
   * @swagger
   * /api/users/{id}/roles:
   *   post:
   *     summary: 分配角色给用户
   *     description: 覆盖式分配角色，最多允许分配10个角色。
   *     tags: [Users]
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
   *               roleIds:
   *                 type: array
   *                 items: { type: integer }
   *     responses:
   *       200: { description: 分配成功 }
   *       400: { description: 参数错误 }
   */
  async assignRoles(ctx: AppContext): Promise<void> {
    try {
      const userId = parseInt(ctx.params.id);
      if (isNaN(userId)) {
        this.error(ctx, '用户ID必须是数字', 400);
        return;
      }

      const { roleIds } = ctx.request.body as { roleIds: number[] };

      if (!Array.isArray(roleIds)) {
        this.error(ctx, '角色ID必须是数组', 400);
        return;
      }

      if (roleIds.length > 10) {
        this.error(ctx, '用户最多分配10个角色', 400);
        return;
      }

      const result = await this.userService.assignRoles(userId, roleIds);
      this.handleServiceResponse(ctx, result);
    } catch {
      this.serverError(ctx, '分配角色失败');
    }
  }

  /**
   * 获取用户角色
   * GET /api/users/:id/roles
   * @param ctx Koa上下文
   */
  /**
   * @swagger
   * /api/users/{id}/roles:
   *   get:
   *     summary: 获取用户角色
   *     description: 返回用户当前绑定的角色列表。
   *     tags: [Users]
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
   *                     data:
   *                       type: array
   *                       items: { $ref: '#/components/schemas/Role' }
   *       400: { description: 参数错误 }
   *       404: { description: 未找到 }
   */
  async getUserRoles(ctx: AppContext): Promise<void> {
    try {
      const userId = parseInt(ctx.params.id);
      if (isNaN(userId)) {
        this.error(ctx, '用户ID必须是数字', 400);
        return;
      }

      const result = await this.userService.getUserRoles(userId);
      this.handleServiceResponse(ctx, result);
    } catch {
      this.serverError(ctx, '获取用户角色失败');
    }
  }

  /**
   * 获取用户统计信息
   * GET /api/users/stats
   * @param ctx Koa上下文
   */
  /**
   * @swagger
   * /api/users/stats:
   *   get:
   *     summary: 获取用户统计信息
   *     description: 返回总数、活跃数、禁用数，以及按专业与入学年份的聚合统计。
   *     tags: [Users]
   *     responses:
   *       200:
   *         description: 成功
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/ApiResponse' }
   */
  async getUserStats(ctx: AppContext): Promise<void> {
    try {
      const result = await this.userService.getUserStats();
      this.handleServiceResponse(ctx, result);
    } catch {
      this.serverError(ctx, '获取用户统计失败');
    }
  }
}
