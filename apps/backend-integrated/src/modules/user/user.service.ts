import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { CreateUserInput, LoginParams, ApiResponse, UpdateUserInput } from '@csisp/types';
import { Status } from '@csisp/types';
import { get, set, del } from '@infra/redis';
import { User } from '@infra/postgres/models/user.model';
import { Role } from '@infra/postgres/models/role.model';
import { UserRole } from '@infra/postgres/models/user-role.model';
import type { PaginationParams, PaginationResponse } from '@csisp/types';

/**
 * 用户领域服务
 *
 * 负责用户注册、登录、角色分配、查询统计等操作，
 * 底层通过注入的 Sequelize 模型访问 PostgreSQL。
 */
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectModel(User) private readonly userModel: any,
    @InjectModel(UserRole) private readonly userRoleModel: any,
    @InjectModel(Role) private readonly roleModel: any
  ) {}

  async register(userData: CreateUserInput): Promise<ApiResponse<any>> {
    try {
      const existingUser = await this.userModel.findOne({ where: { username: userData.username } });
      if (existingUser) {
        return { code: 409, message: '用户名已存在' };
      }

      const existingStudent = await this.userModel.findOne({
        where: { student_id: userData.studentId },
      });
      if (existingStudent) {
        return { code: 409, message: '学号已存在' };
      }

      const hashedPassword = await bcrypt.hash(userData.password, 12);

      const user = await this.userModel.create({
        username: userData.username,
        password: hashedPassword,
        student_id: userData.studentId,
        real_name: userData.realName,
        enrollment_year: userData.enrollmentYear,
        major: userData.major,
        status: userData.status ?? Status.Active,
      });

      if (process.env.REDIS_ENABLED === 'true') {
        await del('be:user:stats');
      }

      return {
        code: 201,
        message: '用户注册成功',
        data: user,
      };
    } catch (error) {
      return this.handleError(error, '用户注册失败');
    }
  }

  async login(loginData: LoginParams): Promise<ApiResponse<any>> {
    try {
      const { username, password } = loginData;

      const user = await this.userModel.findOne({ where: { username } });
      if (!user) {
        return { code: 401, message: '用户名或密码错误' };
      }

      if (user.status === Status.Inactive) {
        return { code: 403, message: '账户已被禁用' };
      }

      const isPasswordValid = await bcrypt.compare(password, (user as any).password);
      if (!isPasswordValid) {
        return { code: 401, message: '用户名或密码错误' };
      }

      const userWithRoles = await this.userModel.findByPk((user as any).id, {
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

  async findById(userId: number): Promise<ApiResponse<any>> {
    try {
      const cacheKey = `be:user:byId:${userId}`;
      if (process.env.REDIS_ENABLED === 'true') {
        const cached = await get(cacheKey);
        if (cached) return JSON.parse(cached) as ApiResponse<any>;
      }

      const user = await this.userModel.findByPk(userId);
      if (!user) {
        return { code: 404, message: '用户不存在' } as ApiResponse<any>;
      }

      const resp: ApiResponse<any> = {
        code: 200,
        message: '获取用户成功',
        data: user,
      };

      if (process.env.REDIS_ENABLED === 'true') {
        await set(cacheKey, JSON.stringify(resp), 600);
      }

      return resp;
    } catch (error) {
      return this.handleError(error, '获取用户失败') as ApiResponse<any>;
    }
  }

  async findByStudentId(studentId: string): Promise<ApiResponse<any | null>> {
    try {
      const cacheKey = `be:user:byStudentId:${studentId}`;
      if (process.env.REDIS_ENABLED === 'true') {
        const cached = await get(cacheKey);
        if (cached) return JSON.parse(cached) as ApiResponse<any | null>;
      }

      const user = await this.userModel.findOne({ where: { student_id: studentId } });

      if (!user) {
        return { code: 404, message: '用户不存在' };
      }

      const resp: ApiResponse<any | null> = {
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

  async bulkCreate(usersData: CreateUserInput[]): Promise<ApiResponse<any[]>> {
    try {
      const processedUsers = await Promise.all(
        usersData.map(async userData => ({
          username: userData.username,
          password: await bcrypt.hash(userData.password, 12),
          student_id: userData.studentId,
          real_name: userData.realName,
          enrollment_year: userData.enrollmentYear,
          major: userData.major,
          status: userData.status || Status.Active,
        }))
      );

      const users = await this.userModel.bulkCreate(processedUsers);
      const result = users.map((user: any) => user);

      if (process.env.REDIS_ENABLED === 'true') {
        await del('be:user:stats');
      }

      return {
        code: 201,
        message: '批量创建用户成功',
        data: result,
      };
    } catch (error) {
      return this.handleError(error, '批量创建用户失败');
    }
  }

  async assignRoles(userId: number, roleIds: number[]): Promise<ApiResponse<boolean>> {
    try {
      const user = await this.userModel.findByPk(userId);
      if (!user) {
        return { code: 404, message: '用户不存在' };
      }

      await this.userRoleModel.destroy({ where: { user_id: userId } });

      if (roleIds.length > 0) {
        const userRoles = roleIds.map(roleId => ({
          user_id: userId,
          role_id: roleId,
        }));
        await this.userRoleModel.bulkCreate(userRoles);
      }

      if (process.env.REDIS_ENABLED === 'true') {
        await del(`be:user:roles:${userId}`);
      }

      return {
        code: 200,
        message: '角色分配成功',
        data: true,
      };
    } catch (error) {
      return this.handleError(error, '角色分配失败');
    }
  }

  async getUserRoles(userId: number): Promise<ApiResponse<any[]>> {
    try {
      const cacheKey = `be:user:roles:${userId}`;
      if (process.env.REDIS_ENABLED === 'true') {
        const cached = await get(cacheKey);
        if (cached) return JSON.parse(cached) as ApiResponse<any[]>;
      }

      const user = await this.userModel.findByPk(userId, {
        include: [
          {
            model: this.roleModel,
            through: { attributes: [] },
          },
        ],
      });

      if (!user) {
        return { code: 404, message: '用户不存在' };
      }

      const resp: ApiResponse<any[]> = {
        code: 200,
        message: '获取用户角色成功',
        data: (user as any).Roles || [],
      };

      if (process.env.REDIS_ENABLED === 'true') {
        await set(cacheKey, JSON.stringify(resp), 600);
      }

      return resp;
    } catch (error) {
      return this.handleError(error, '获取用户角色失败');
    }
  }

  async getUserStats(): Promise<ApiResponse<any>> {
    try {
      const cacheKey = 'be:user:stats';
      if (process.env.REDIS_ENABLED === 'true') {
        const cached = await get(cacheKey);
        if (cached) return JSON.parse(cached) as ApiResponse<any>;
      }

      const totalCount = await this.userModel.count();
      const activeCount = await this.userModel.count({ where: { status: Status.Active } });
      const inactiveCount = await this.userModel.count({ where: { status: Status.Inactive } });

      const majorStats = await this.userModel.findAll({
        attributes: ['major', [this.userModel.sequelize!.fn('COUNT', '*'), 'count']],
        group: ['major'],
        raw: true,
      });

      const yearStats = await this.userModel.findAll({
        attributes: ['enrollment_year', [this.userModel.sequelize!.fn('COUNT', '*'), 'count']],
        group: ['enrollment_year'],
        order: [['enrollment_year', 'DESC']],
        raw: true,
      });

      const resp: ApiResponse<any> = {
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

  async update(userId: number, updateData: UpdateUserInput): Promise<ApiResponse<any>> {
    try {
      const payload: any = {};

      if (updateData.realName !== undefined) {
        payload.real_name = updateData.realName;
      }
      if ((updateData as any).email !== undefined) {
        payload.email = (updateData as any).email;
      }
      if ((updateData as any).phone !== undefined) {
        payload.phone = (updateData as any).phone;
      }
      if (updateData.major !== undefined) {
        payload.major = updateData.major;
      }
      if (updateData.status !== undefined) {
        payload.status = updateData.status;
      }

      const [affectedCount, affectedRows] = await this.userModel.update(payload, {
        where: { id: userId },
        returning: true,
      });

      if (affectedCount === 0) {
        return { code: 404, message: '用户不存在' };
      }

      return {
        code: 200,
        message: '更新成功',
        data: affectedRows[0],
      };
    } catch (error) {
      return this.handleError(error, '更新用户信息失败');
    }
  }

  async findAllWithPagination(
    params: PaginationParams,
    where?: any
  ): Promise<ApiResponse<PaginationResponse<any>>> {
    try {
      const { page, size } = params;
      const offset = (page - 1) * size;

      const { count, rows } = await this.userModel.findAndCountAll({
        where,
        limit: size,
        offset,
        order: [['created_at', 'DESC']],
      });

      const totalPages = Math.ceil(count / size);

      const payload: PaginationResponse<any> = {
        data: rows,
        total: count,
        page,
        size,
        totalPages,
      };

      return {
        code: 200,
        message: '查询成功',
        data: payload,
      };
    } catch (error) {
      return this.handleError(error, '查询失败');
    }
  }

  private handleError(error: unknown, message: string): ApiResponse {
    // const errorMessage = error instanceof Error ? error.message : String(error);
    this.logger.error(message, error instanceof Error ? error.stack : undefined);
    return {
      code: 500,
      message,
    };
  }
}
