import { Body, Controller, Get, Inject, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import type { ApiResponse, PaginationParams, Status } from '@csisp/types';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateClassDto } from './dto/create-class.dto';
import { CreateTimeSlotDto } from './dto/create-time-slot.dto';
import { CreateSubCourseDto } from './dto/create-sub-course.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ParseIdPipe } from '@common/pipes/parse-id.pipe';
import { PaginationPipe } from '@common/pipes/pagination.pipe';
import { CourseService } from './course.service';

/**
 * 课程控制器
 *
 * 提供课程创建、教师分配、班级/子课程/时间段管理及查询接口。
 */
@Controller('courses')
export class CourseController {
  constructor(@Inject('COURSE_SERVICE') private readonly courseService: CourseService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async createCourse(@Body() body: CreateCourseDto): Promise<ApiResponse<any>> {
    return this.courseService.createCourse(body as any);
  }

  @Post(':id/teachers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async assignTeachers(
    @Param('id', ParseIdPipe) id: number,
    @Body() body: { teacherIds: number[] }
  ): Promise<ApiResponse<boolean>> {
    const { teacherIds } = body;
    if (!Array.isArray(teacherIds) || teacherIds.length === 0) {
      return { code: 400, message: '教师ID必须是非空数组' } as ApiResponse<boolean>;
    }
    if (teacherIds.length > 10) {
      return { code: 400, message: '最多分配10个教师' } as ApiResponse<boolean>;
    }
    return this.courseService.assignTeachers(id, teacherIds);
  }

  @Post('classes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher', 'admin')
  async createClass(@Body() body: CreateClassDto): Promise<ApiResponse<any>> {
    return this.courseService.createClass(body as any);
  }

  @Post('time-slots')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher', 'admin')
  async createTimeSlot(@Body() body: CreateTimeSlotDto): Promise<ApiResponse<any>> {
    return this.courseService.createTimeSlot(body as any);
  }

  @Post('sub-courses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher', 'admin')
  async createSubCourse(@Body() body: CreateSubCourseDto): Promise<ApiResponse<any>> {
    return this.courseService.createSubCourse(body as any);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getCourses(
    @Query(PaginationPipe) pagination: PaginationParams,
    @Query() query: Record<string, any>
  ): Promise<ApiResponse<any>> {
    const major = query.major as string | undefined;
    const semester = query.semester !== undefined ? Number(query.semester) : undefined;
    return this.courseService.getCoursesByMajor(pagination, major, semester);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getCourseDetail(@Param('id', ParseIdPipe) id: number): Promise<ApiResponse<any>> {
    return this.courseService.getCourseDetail(id);
  }

  @Get(':id/teachers')
  @UseGuards(JwtAuthGuard)
  async getCourseTeachers(@Param('id', ParseIdPipe) id: number): Promise<ApiResponse<any>> {
    const detail = await this.courseService.getCourseDetail(id);
    if (detail.code !== 200) return detail;
    const teachers = (detail.data as any)?.Teachers ?? [];
    return { code: 200, message: '获取课程教师成功', data: teachers };
  }

  @Get(':id/classes')
  @UseGuards(JwtAuthGuard)
  async getCourseClasses(@Param('id', ParseIdPipe) id: number): Promise<ApiResponse<any>> {
    const detail = await this.courseService.getCourseDetail(id);
    if (detail.code !== 200) return detail;
    const classes = (detail.data as any)?.Classes ?? [];
    return { code: 200, message: '获取课程班级成功', data: classes };
  }

  @Get('classes/:classId')
  @UseGuards(JwtAuthGuard)
  async getClassDetail(@Param('classId', ParseIdPipe) classId: number): Promise<ApiResponse<any>> {
    const classModel = (this.courseService as any).classModel;
    const classInstance = await classModel.findByPk(classId);
    if (!classInstance) {
      return { code: 404, message: '班级不存在' };
    }
    return { code: 200, message: '获取班级详情成功', data: classInstance };
  }

  @Get('classes/:classId/students')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher')
  async getClassStudents(
    @Param('classId', ParseIdPipe) classId: number,
    @Query(PaginationPipe) pagination: PaginationParams
  ): Promise<ApiResponse<any>> {
    return this.courseService.getClassStudents(classId, pagination);
  }

  @Get('semester/:year/:semester')
  @UseGuards(JwtAuthGuard)
  async getCoursesBySemester(
    @Param('year', ParseIdPipe) year: number,
    @Param('semester', ParseIdPipe) semester: number
  ): Promise<ApiResponse<any[]>> {
    return this.courseService.getCoursesBySemester(year, semester);
  }

  @Get('teacher/:teacherId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher')
  async getTeacherCourses(
    @Param('teacherId', ParseIdPipe) teacherId: number,
    @Query(PaginationPipe) pagination: PaginationParams
  ): Promise<ApiResponse<any>> {
    return this.courseService.getTeacherCourses(teacherId, pagination);
  }

  @Get('distribution')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getCourseDistribution(): Promise<ApiResponse<Array<{ name: string; value: number }>>> {
    return this.courseService.getCourseDistribution();
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async updateCourseStatus(
    @Param('id', ParseIdPipe) id: number,
    @Body('status') status: Status
  ): Promise<ApiResponse<any>> {
    return this.courseService.updateCourseStatus(id, status);
  }
}
