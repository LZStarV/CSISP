import { Body, Controller, Get, Inject, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import type { ApiResponse, AttendanceStatus, PaginationParams } from '@csisp/types';
import { CreateAttendanceTaskDto } from './dto/create-attendance-task.dto';
import { CreateAttendanceRecordDto } from './dto/create-attendance-record.dto';
import { UpdateAttendanceTaskStatusDto } from './dto/update-attendance-task-status.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ParseIdPipe } from '@common/pipes/parse-id.pipe';
import { PaginationPipe } from '@common/pipes/pagination.pipe';
import { AttendanceService } from './attendance.service';

/**
 * 考勤控制器（Nest 版本）
 *
 * 提供考勤任务创建、打卡、记录与统计等接口。
 */
@Controller('attendance')
export class AttendanceController {
  constructor(
    @Inject('ATTENDANCE_SERVICE')
    private readonly attendanceService: AttendanceService
  ) {}

  @Post('tasks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher')
  async createAttendanceTask(@Body() body: CreateAttendanceTaskDto): Promise<ApiResponse<any>> {
    return this.attendanceService.createAttendanceTask(body as any);
  }

  @Post('checkin')
  @UseGuards(JwtAuthGuard)
  async checkIn(
    @Body('taskId', ParseIdPipe) taskId: number,
    @Body('userId') userId?: number
  ): Promise<ApiResponse<any>> {
    // 默认从 JWT 中获取 userId，body 中的 userId 仅作为占位
    const effectiveUserId = userId ?? 0;
    return this.attendanceService.checkIn(effectiveUserId, taskId);
  }

  @Get('tasks/class/:classId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher')
  async getClassAttendanceTasks(
    @Param('classId', ParseIdPipe) classId: number,
    @Query(PaginationPipe) pagination: PaginationParams
  ): Promise<ApiResponse<any>> {
    return this.attendanceService.getClassAttendanceTasks(classId, pagination);
  }

  @Get('tasks/active')
  @UseGuards(JwtAuthGuard)
  async getActiveAttendanceTasks(): Promise<ApiResponse<any[]>> {
    return this.attendanceService.getActiveAttendanceTasks();
  }

  @Get('tasks/:taskId/records')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher')
  async getTaskRecords(
    @Param('taskId', ParseIdPipe) taskId: number,
    @Query(PaginationPipe) pagination: PaginationParams
  ): Promise<ApiResponse<any>> {
    return this.attendanceService.getTaskRecords(taskId, pagination);
  }

  @Get('stats/student/:userId')
  @UseGuards(JwtAuthGuard)
  async getStudentAttendanceStats(
    @Param('userId', ParseIdPipe) userId: number,
    @Query('classId') classIdQuery?: string
  ): Promise<ApiResponse<any>> {
    const classId = classIdQuery ? Number(classIdQuery) : undefined;
    return this.attendanceService.getStudentAttendanceStats(userId, classId);
  }

  @Get('stats/class/:classId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher')
  async getClassAttendanceStats(
    @Param('classId', ParseIdPipe) classId: number
  ): Promise<ApiResponse<any>> {
    return this.attendanceService.getClassAttendanceStats(classId);
  }

  @Get('records/student/:userId')
  @UseGuards(JwtAuthGuard)
  async getStudentAttendanceRecords(
    @Param('userId', ParseIdPipe) userId: number,
    @Query(PaginationPipe) pagination: PaginationParams
  ): Promise<ApiResponse<any>> {
    return this.attendanceService.getStudentAttendanceRecords(userId, pagination);
  }

  @Put('records/batch')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher')
  async batchUpdateAttendanceRecords(
    @Body('recordIds') recordIds: number[],
    @Body('status') status: AttendanceStatus
  ): Promise<ApiResponse<any>> {
    if (!Array.isArray(recordIds) || recordIds.length === 0) {
      return { code: 400, message: 'recordIds 必须是非空数组' };
    }
    return this.attendanceService.batchUpdateAttendanceRecords(recordIds, status);
  }

  @Put('records/:recordId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher')
  async updateAttendanceRecord(
    @Param('recordId', ParseIdPipe) recordId: number,
    @Body('status') status: AttendanceStatus
  ): Promise<ApiResponse<any>> {
    return this.attendanceService.updateAttendanceRecord(recordId, status);
  }

  @Get('records/export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher')
  async exportAttendanceData(
    @Query('classId', ParseIdPipe) classId: number
  ): Promise<ApiResponse<any>> {
    return this.attendanceService.exportAttendanceData(classId);
  }
}
