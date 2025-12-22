import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import type {
  ApiResponse,
  CreateHomeworkInput,
  CreateHomeworkSubmissionInput,
  PaginationParams,
  Status,
} from '@csisp/types';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ParseIdPipe } from '@common/pipes/parse-id.pipe';
import { PaginationPipe } from '@common/pipes/pagination.pipe';
import { HomeworkService } from './homework.service';

/**
 * 作业控制器（Nest 版本）
 *
 * 提供作业发布、提交、列表、统计与批改等接口。
 */
@Controller('homework')
export class HomeworkController {
  constructor(private readonly homeworkService: HomeworkService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher')
  async createHomework(@Body() body: CreateHomeworkInput): Promise<ApiResponse<any>> {
    return this.homeworkService.createHomework(body);
  }

  @Post('submit')
  @UseGuards(JwtAuthGuard)
  async submitHomework(@Body() body: CreateHomeworkSubmissionInput): Promise<ApiResponse<any>> {
    return this.homeworkService.submitHomework(body);
  }

  @Get('class/:classId')
  @UseGuards(JwtAuthGuard)
  async getClassHomeworks(
    @Param('classId', ParseIdPipe) classId: number,
    @Query(PaginationPipe) pagination: PaginationParams
  ): Promise<ApiResponse<any>> {
    return this.homeworkService.getClassHomeworks(classId, pagination);
  }

  @Get(':homeworkId/submissions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher')
  async getHomeworkSubmissions(
    @Param('homeworkId', ParseIdPipe) homeworkId: number,
    @Query(PaginationPipe) pagination: PaginationParams
  ): Promise<ApiResponse<any>> {
    return this.homeworkService.getHomeworkSubmissions(homeworkId, pagination);
  }

  @Get(':homeworkId/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher')
  async getHomeworkStats(
    @Param('homeworkId', ParseIdPipe) homeworkId: number
  ): Promise<ApiResponse<any>> {
    return this.homeworkService.getHomeworkStats(homeworkId);
  }

  @Put(':homeworkId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher')
  async updateHomeworkStatus(
    @Param('homeworkId', ParseIdPipe) homeworkId: number,
    @Body('status') status: Status
  ): Promise<ApiResponse<any>> {
    return this.homeworkService.updateHomeworkStatus(homeworkId, status);
  }

  @Get('student/:userId')
  @UseGuards(JwtAuthGuard)
  async getStudentHomeworkSummary(
    @Param('userId', ParseIdPipe) userId: number,
    @Query('classId') classIdQuery?: string
  ): Promise<ApiResponse<any>> {
    const classId = classIdQuery ? Number(classIdQuery) : undefined;
    return this.homeworkService.getStudentHomeworkSummary(userId, classId);
  }

  @Put('grade')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher')
  async gradeHomework(
    @Body('homeworkId', ParseIdPipe) homeworkId: number,
    @Body('userId', ParseIdPipe) userId: number,
    @Body('score') score: number,
    @Body('comment') comment?: string
  ): Promise<ApiResponse<any>> {
    return this.homeworkService.gradeHomework(homeworkId, userId, score, comment);
  }

  @Put(':homeworkId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher')
  async updateHomework(
    @Param('homeworkId', ParseIdPipe) homeworkId: number,
    @Body() body: Partial<CreateHomeworkInput>
  ): Promise<ApiResponse<any>> {
    return this.homeworkService.updateHomework(homeworkId, body);
  }

  @Delete(':homeworkId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher')
  async deleteHomework(
    @Param('homeworkId', ParseIdPipe) homeworkId: number
  ): Promise<ApiResponse<any>> {
    return this.homeworkService.deleteHomework(homeworkId);
  }

  @Get(':homeworkId')
  @UseGuards(JwtAuthGuard)
  async getHomeworkDetail(
    @Param('homeworkId', ParseIdPipe) homeworkId: number
  ): Promise<ApiResponse<any>> {
    return this.homeworkService.getHomeworkDetail(homeworkId);
  }

  @Get(':homeworkId/student/:userId')
  @UseGuards(JwtAuthGuard)
  async getStudentHomeworkDetail(
    @Param('homeworkId', ParseIdPipe) homeworkId: number,
    @Param('userId', ParseIdPipe) userId: number
  ): Promise<ApiResponse<any>> {
    return this.homeworkService.getStudentHomeworkDetail(homeworkId, userId);
  }
}
