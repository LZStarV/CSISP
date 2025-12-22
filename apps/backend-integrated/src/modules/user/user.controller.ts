import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import type {
  CreateUserInput,
  LoginParams,
  ApiResponse,
  UpdateUserInput,
  PaginationParams,
} from '@csisp/types';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ParseIdPipe } from '@common/pipes/parse-id.pipe';
import { PaginationPipe } from '@common/pipes/pagination.pipe';
import { UserService } from './user.service';

/**
 * 用户控制器
 *
 * 提供：注册、登录、当前用户、按 ID/学号查询、列表、批量创建、角色分配与统计等接口。
 */
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(@Body() body: CreateUserInput): Promise<ApiResponse<any>> {
    return this.userService.register(body);
  }

  @Post('login')
  async login(@Body() body: LoginParams): Promise<ApiResponse<any>> {
    return this.userService.login(body);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Req() req: unknown): Promise<ApiResponse<any>> {
    const user = (req as any).user;
    const userId: number | undefined = user?.userId;
    if (!userId) {
      return { code: 401, message: '未登录或登录已过期' };
    }
    return this.userService.findById(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getUserById(@Param('id', ParseIdPipe) id: number): Promise<ApiResponse<any>> {
    return this.userService.findById(id);
  }

  @Get('student/:studentId')
  @UseGuards(JwtAuthGuard)
  async getUserByStudentId(
    @Param('studentId') studentId: string
  ): Promise<ApiResponse<any | null>> {
    if (!studentId) {
      return { code: 400, message: '学号不能为空' };
    }
    return this.userService.findByStudentId(studentId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateUser(
    @Param('id', ParseIdPipe) id: number,
    @Body() body: UpdateUserInput
  ): Promise<ApiResponse<any>> {
    return this.userService.update(id, body);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getUsers(
    @Query(PaginationPipe) pagination: PaginationParams,
    @Query() query: Record<string, any>
  ): Promise<ApiResponse<any>> {
    const where: Record<string, any> = {};
    const { major, enrollmentYear, status } = query;

    if (major) where.major = major;
    if (enrollmentYear !== undefined) where.enrollmentYear = Number(enrollmentYear);
    if (status !== undefined) where.status = Number(status);

    return this.userService.findAllWithPagination(pagination, where);
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async bulkCreateUsers(@Body() usersData: CreateUserInput[]): Promise<ApiResponse<any>> {
    if (!Array.isArray(usersData) || usersData.length === 0) {
      return { code: 400, message: '用户数据必须是数组且不能为空' };
    }

    if (usersData.length > 100) {
      return { code: 400, message: '一次最多创建100个用户' };
    }

    for (let i = 0; i < usersData.length; i += 1) {
      const user = usersData[i];
      const requiredParams: (keyof CreateUserInput)[] = [
        'username',
        'password',
        'realName',
        'studentId',
        'enrollmentYear',
        'major',
      ];
      const missing = requiredParams.filter(key => !user[key]);
      if (missing.length > 0) {
        return {
          code: 400,
          message: `第${i + 1}个用户缺少必填字段: ${missing.join(', ')}`,
        };
      }
    }

    return this.userService.bulkCreate(usersData);
  }

  @Post(':id/roles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async assignRoles(
    @Param('id', ParseIdPipe) id: number,
    @Body() body: { roleIds: number[] }
  ): Promise<ApiResponse<boolean>> {
    const { roleIds } = body;
    if (!Array.isArray(roleIds)) {
      return { code: 400, message: '角色ID必须是数组' } as ApiResponse<boolean>;
    }
    if (roleIds.length > 10) {
      return { code: 400, message: '用户最多分配10个角色' } as ApiResponse<boolean>;
    }
    return this.userService.assignRoles(id, roleIds);
  }

  @Get(':id/roles')
  @UseGuards(JwtAuthGuard)
  async getUserRoles(@Param('id', ParseIdPipe) id: number): Promise<ApiResponse<any[]>> {
    return this.userService.getUserRoles(id);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getUserStats(): Promise<ApiResponse<any>> {
    return this.userService.getUserStats();
  }
}
