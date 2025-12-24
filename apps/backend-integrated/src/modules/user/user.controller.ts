import {
  Body,
  Controller,
  Get,
  Inject,
  Logger,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { ApiResponse, PaginationParams } from '@csisp/types';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginDto } from './dto/login.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
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
  private readonly userService: UserService;

  private readonly logger = new Logger(UserController.name);

  constructor(@Inject('USER_SERVICE') userService: UserService) {
    this.userService = userService;
  }

  @Post('register')
  async register(@Body() body: CreateUserDto): Promise<ApiResponse<any>> {
    return this.userService.register(body as any);
  }

  @Post('login')
  async login(@Body() body: LoginDto): Promise<ApiResponse<any>> {
    this.logger.log(`login called, userService: ${this.userService ? 'ok' : 'undefined'}`);
    if (!this.userService) {
      return { code: 500, message: 'UserService not initialized' } as ApiResponse<any>;
    }
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
    @Body() body: UpdateUserDto
  ): Promise<ApiResponse<any>> {
    return this.userService.update(id, body as any);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getUsers(
    @Query(PaginationPipe) pagination: PaginationParams,
    @Query() query: ListUsersQueryDto
  ): Promise<ApiResponse<any>> {
    const where: Record<string, any> = {};
    const { major, enrollmentYear, status } = query;
    if (major) where.major = major;
    if (enrollmentYear !== undefined) where.enrollmentYear = enrollmentYear;
    if (status !== undefined) where.status = status;
    return this.userService.findAllWithPagination(pagination, where);
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async bulkCreateUsers(@Body() usersData: CreateUserDto[]): Promise<ApiResponse<any>> {
    if (!Array.isArray(usersData) || usersData.length === 0) {
      return { code: 400, message: '用户数据必须是数组且不能为空' };
    }

    if (usersData.length > 100) {
      return { code: 400, message: '一次最多创建100个用户' };
    }

    for (let i = 0; i < usersData.length; i += 1) {
      const user = usersData[i];
      const requiredParams: (keyof CreateUserDto)[] = [
        'username',
        'password',
        'realName',
        'studentId',
        'enrollmentYear',
        'major',
      ];
      const missing = requiredParams.filter(key => !(user as any)[key]);
      if (missing.length > 0) {
        return {
          code: 400,
          message: `第${i + 1}个用户缺少必填字段: ${missing.join(', ')}`,
        };
      }
    }

    return this.userService.bulkCreate(usersData as any);
  }

  @Post(':id/roles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async assignRoles(
    @Param('id', ParseIdPipe) id: number,
    @Body() body: AssignRolesDto
  ): Promise<ApiResponse<boolean>> {
    return this.userService.assignRoles(id, body.roleIds);
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
