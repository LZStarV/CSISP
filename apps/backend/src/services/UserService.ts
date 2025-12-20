/**
 * 用户服务类
 * 处理用户相关的业务逻辑，包括用户管理、认证、角色分配等
 */
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { CreateUserInput, LoginParams, ApiResponse, Status } from '@csisp/types';
import { BaseService } from './BaseService';
import { get, set, del } from '@csisp/redis';

export class UserService extends BaseService {
  private userRoleModel: any;
  private roleModel: any;

  constructor(userModel: any, userRoleModel: any, roleModel: any) {
    super(userModel);
    this.userRoleModel = userRoleModel;
    this.roleModel = roleModel;
  }

  /**
   * 用户注册
   * @param userData 用户注册数据
   * @returns 注册结果
   */
  async register(userData: CreateUserInput): Promise<ApiResponse<any>> {
    try {
      // 检查用户名是否已存在
      const existingUser = await this.model.findOne({ where: { username: userData.username } });

      if (existingUser) {
        return {
          code: 409,
          message: '用户名已存在',
        };
      }

      // 检查学号是否已存在
      const existingStudent = await this.model.findOne({
        where: { student_id: userData.studentId },
      });

      if (existingStudent) {
        return {
          code: 409,
          message: '学号已存在',
        };
      }

      // 密码加密
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // 创建用户 - 使用mapper转换数据
      const user = await this.model.create({
        username: userData.username,
        password: hashedPassword,
        student_id: userData.studentId,
        real_name: userData.realName,
        enrollment_year: userData.enrollmentYear,
        major: userData.major,
        status: userData.status || Status.Active,
      });

      const resp = {
        code: 201,
        message: '用户注册成功',
        data: user,
      };
      if (process.env.REDIS_ENABLED === 'true') {
        await del('be:user:stats');
      }
      return resp;
    } catch (error) {
      return this.handleError(error, '用户注册失败');
    }
  }

  /**
   * 用户登录
   * @param loginData 登录参数
   * @returns 登录结果，包含JWT令牌
   */
  async login(loginData: LoginParams): Promise<ApiResponse<any>> {
    try {
      const { username, password } = loginData;

      // 查找用户
      const user = await this.model.findOne({ where: { username } });

      if (!user) {
        return {
          code: 401,
          message: '用户名或密码错误',
        };
      }

      // 检查用户状态
      if (user.status === Status.Inactive) {
        return {
          code: 403,
          message: '账户已被禁用',
        };
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, (user as any).password);
      if (!isPasswordValid) {
        return {
          code: 401,
          message: '用户名或密码错误',
        };
      }

      const userWithRoles = await this.model.findByPk((user as any).id, {
        include: [
          {
            model: this.roleModel,
            attributes: ['id', 'name', 'code'],
            through: { attributes: [] },
          },
        ],
      });
      let roles = ((userWithRoles as any)?.Roles || [])
        .map((role: any) => role.code || role.name)
        .filter(Boolean);

      if ((!roles || roles.length === 0) && (user as any).username === 'admin') {
        roles = ['admin'];
      }

      // 生成JWT令牌
      const token = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          roles,
        },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' } as any
      );

      return {
        code: 200,
        message: '登录成功',
        data: {
          token,
          user: userWithRoles,
          roles: roles as string[],
        },
      };
    } catch (error) {
      return this.handleError(error, '登录失败');
    }
  }

  /**
   * 分配角色给用户
   * @param userId 用户ID
   * @param roleIds 角色ID数组
   * @returns 分配结果
   */
  async assignRoles(userId: number, roleIds: number[]): Promise<ApiResponse<boolean>> {
    try {
      // 检查用户是否存在
      const user = await this.model.findByPk(userId);
      if (!user) {
        return {
          code: 404,
          message: '用户不存在',
        } as ApiResponse<boolean>;
      }

      // 删除现有角色关联
      await this.userRoleModel.destroy({
        where: { user_id: userId }, // 注意字段映射
      });

      // 创建新的角色关联
      if (roleIds.length > 0) {
        const userRoles = roleIds.map((roleId: number) => ({
          user_id: userId, // 注意字段映射
          role_id: roleId, // 注意字段映射
        }));

        await this.userRoleModel.bulkCreate(userRoles);
      }

      const resp = {
        code: 200,
        message: '角色分配成功',
        data: true,
      };
      if (process.env.REDIS_ENABLED === 'true') {
        await del(`be:user:roles:${userId}`);
      }
      return resp;
    } catch (error) {
      return this.handleError(error, '角色分配失败') as ApiResponse<boolean>;
    }
  }

  /**
   * 获取用户角色
   * @param userId 用户ID
   * @returns 用户角色列表
   */
  async getUserRoles(userId: number): Promise<ApiResponse<any[]>> {
    try {
      const cacheKey = `be:user:roles:${userId}`;
      if (process.env.REDIS_ENABLED === 'true') {
        const cached = await get(cacheKey);
        if (cached) return JSON.parse(cached) as ApiResponse<any[]>;
      }
      const user = await this.model.findByPk(userId, {
        include: [
          {
            model: this.roleModel,
            through: { attributes: [] },
          },
        ],
      });

      if (!user) {
        return {
          code: 404,
          message: '用户不存在',
        } as ApiResponse<any[]>;
      }

      const resp = {
        code: 200,
        message: '获取用户角色成功',
        data: (user as any).Roles || [],
      };
      if (process.env.REDIS_ENABLED === 'true') {
        await set(cacheKey, JSON.stringify(resp), 600);
      }
      return resp;
    } catch (error) {
      return this.handleError(error, '获取用户角色失败') as ApiResponse<any[]>;
    }
  }

  /**
   * 根据学号查找用户
   * @param studentId 学号
   * @returns 用户信息
   */
  async findByStudentId(studentId: string): Promise<ApiResponse<any | null>> {
    try {
      const cacheKey = `be:user:byStudentId:${studentId}`;
      if (process.env.REDIS_ENABLED === 'true') {
        const cached = await get(cacheKey);
        if (cached) return JSON.parse(cached) as ApiResponse<any | null>;
      }
      const user = await this.model.findOne({ where: { student_id: studentId } });

      if (!user) {
        return {
          code: 404,
          message: '用户不存在',
        };
      }

      const resp = {
        code: 200,
        message: '查询成功',
        data: user,
      };
      if (process.env.REDIS_ENABLED === 'true') {
        await set(cacheKey, JSON.stringify(resp), 600);
      }
      return resp;
    } catch (error) {
      return this.handleError(error, '查询失败');
    }
  }

  /**
   * 批量创建用户
   * @param usersData 用户数据数组
   * @returns 创建结果
   */
  async bulkCreate(usersData: CreateUserInput[]): Promise<ApiResponse<any[]>> {
    try {
      // 密码批量加密
      const processedUsers = await Promise.all(
        usersData.map(async (userData: any) => ({
          username: userData.username,
          password: await bcrypt.hash(userData.password, 12),
          student_id: userData.studentId,
          real_name: userData.realName,
          enrollment_year: userData.enrollmentYear,
          major: userData.major,
          status: userData.status || Status.Active,
        }))
      );

      const users = await this.model.bulkCreate(processedUsers);

      const result = users.map((user: any) => user);

      const resp = {
        code: 201,
        message: '批量创建用户成功',
        data: result,
      };
      if (process.env.REDIS_ENABLED === 'true') {
        await del('be:user:stats');
      }
      return resp;
    } catch (error) {
      return this.handleError(error, '批量创建用户失败') as ApiResponse<any[]>;
    }
  }

  /**
   * 获取用户统计信息
   * @returns 统计信息
   */
  async getUserStats(): Promise<ApiResponse<any>> {
    try {
      const cacheKey = `be:user:stats`;
      if (process.env.REDIS_ENABLED === 'true') {
        const cached = await get(cacheKey);
        if (cached) return JSON.parse(cached) as ApiResponse<any>;
      }
      const totalCount = await this.model.count();
      const activeCount = await this.model.count({ where: { status: Status.Active } });
      const inactiveCount = await this.model.count({ where: { status: Status.Inactive } });

      // 按专业统计
      const majorStats = await this.model.findAll({
        attributes: ['major', [this.model.sequelize!.fn('COUNT', '*'), 'count']],
        group: ['major'],
        raw: true,
      });

      // 按入学年份统计
      const yearStats = await this.model.findAll({
        attributes: ['enrollment_year', [this.model.sequelize!.fn('COUNT', '*'), 'count']], // 注意字段映射
        group: ['enrollment_year'],
        order: [['enrollment_year', 'DESC']],
        raw: true,
      });

      const resp = {
        code: 200,
        message: '获取用户统计成功',
        data: {
          totalCount,
          activeCount,
          inactiveCount,
          majorStats,
          yearStats,
        },
      };
      if (process.env.REDIS_ENABLED === 'true') {
        await set(cacheKey, JSON.stringify(resp), 120);
      }
      return resp;
    } catch (error) {
      return this.handleError(error, '获取用户统计失败');
    }
  }
}
