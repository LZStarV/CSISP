import { Inject, Injectable, Logger } from '@nestjs/common';
import { Op, type WhereOptions } from 'sequelize';
import type {
  ApiResponse,
  CreateClassInput,
  CreateCourseInput,
  CreateSubCourseInput,
  CreateTimeSlotInput,
  PaginationParams,
  PaginationResponse,
  Status,
} from '@csisp/types';
import { Status as StatusEnum } from '@csisp/types';
import { get, set, del } from '@infra/redis';
import { POSTGRES_MODELS } from '@infra/postgres/postgres.providers';

type ModelsDict = Record<string, any>;

/**
 * 课程领域服务
 *
 * 负责课程管理、教师分配、班级/子课程/时间段管理等操作。
 */
@Injectable()
export class CourseService {
  private readonly logger = new Logger(CourseService.name);

  private readonly courseModel: any;
  private readonly courseTeacherModel: any;
  private readonly teacherModel: any;
  private readonly classModel: any;
  private readonly timeSlotModel: any;
  private readonly subCourseModel: any;
  private readonly userModel: any;

  constructor(@Inject(POSTGRES_MODELS) models: ModelsDict) {
    this.courseModel = models.Course;
    this.courseTeacherModel = models.CourseTeacher;
    this.teacherModel = models.Teacher;
    this.classModel = models.Class;
    this.timeSlotModel = models.TimeSlot;
    this.subCourseModel = models.SubCourse;
    this.userModel = models.User;
  }

  async createCourse(courseData: CreateCourseInput): Promise<ApiResponse<any>> {
    try {
      const existingCourse = await this.courseModel.findOne({
        where: { course_code: courseData.courseCode },
      });

      if (existingCourse) {
        return { code: 409, message: '课程代码已存在' };
      }

      const course = await this.courseModel.create({
        course_name: courseData.courseName,
        course_code: courseData.courseCode,
        semester: courseData.semester,
        academic_year: courseData.academicYear,
        available_majors: courseData.availableMajors,
        status: courseData.status ?? StatusEnum.Active,
      });

      return { code: 201, message: '课程创建成功', data: course };
    } catch (error) {
      return this.handleError(error, '课程创建失败');
    }
  }

  async assignTeachers(courseId: number, teacherIds: number[]): Promise<ApiResponse<boolean>> {
    try {
      const course = await this.courseModel.findByPk(courseId);
      if (!course) {
        return { code: 404, message: '课程不存在' };
      }

      const teachers = await this.teacherModel.findAll({
        where: { id: { [Op.in]: teacherIds } },
      });

      if (teachers.length !== teacherIds.length) {
        return { code: 404, message: '部分教师不存在' };
      }

      await this.courseTeacherModel.destroy({ where: { course_id: courseId } });

      if (teacherIds.length > 0) {
        const courseTeachers = teacherIds.map(teacherId => ({
          course_id: courseId,
          teacher_id: teacherId,
        }));
        await this.courseTeacherModel.bulkCreate(courseTeachers);
      }

      return { code: 200, message: '教师分配成功', data: true };
    } catch (error) {
      return this.handleError(error, '教师分配失败');
    }
  }

  async createClass(classData: CreateClassInput): Promise<ApiResponse<any>> {
    try {
      const course = await this.courseModel.findByPk(classData.courseId);
      if (!course) {
        return { code: 404, message: '课程不存在' };
      }

      const teacher = await this.teacherModel.findByPk(classData.teacherId);
      if (!teacher) {
        return { code: 404, message: '教师不存在' };
      }

      const classInstance = await this.classModel.create({
        class_name: classData.className,
        course_id: classData.courseId,
        teacher_id: classData.teacherId,
        semester: classData.semester,
        academic_year: classData.academicYear,
        max_students: classData.maxStudents,
        status: classData.status ?? StatusEnum.Active,
      });

      return { code: 201, message: '班级创建成功', data: classInstance };
    } catch (error) {
      return this.handleError(error, '班级创建失败');
    }
  }

  async createTimeSlot(timeSlotData: CreateTimeSlotInput): Promise<ApiResponse<any>> {
    try {
      const subCourse = await this.subCourseModel.findByPk(timeSlotData.subCourseId);
      if (!subCourse) {
        return { code: 404, message: '子课程不存在' };
      }

      const timeSlot = await this.timeSlotModel.create({
        sub_course_id: timeSlotData.subCourseId,
        weekday: timeSlotData.weekday,
        start_time: timeSlotData.startTime,
        end_time: timeSlotData.endTime,
        location: timeSlotData.location,
        status: timeSlotData.status ?? StatusEnum.Active,
      });

      return { code: 201, message: '时间段创建成功', data: timeSlot };
    } catch (error) {
      return this.handleError(error, '时间段创建失败');
    }
  }

  async createSubCourse(subCourseData: CreateSubCourseInput): Promise<ApiResponse<any>> {
    try {
      const course = await this.courseModel.findByPk(subCourseData.courseId);
      if (!course) {
        return { code: 404, message: '课程不存在' };
      }

      const teacher = await this.teacherModel.findByPk(subCourseData.teacherId);
      if (!teacher) {
        return { code: 404, message: '教师不存在' };
      }

      const subCourse = await this.subCourseModel.create({
        course_id: subCourseData.courseId,
        sub_course_code: subCourseData.subCourseCode,
        teacher_id: subCourseData.teacherId,
        academic_year: subCourseData.academicYear,
        status: subCourseData.status ?? StatusEnum.Active,
      });

      return { code: 201, message: '子课程创建成功', data: subCourse };
    } catch (error) {
      return this.handleError(error, '子课程创建失败');
    }
  }

  async getCoursesByMajor(
    params: PaginationParams,
    major?: string,
    semester?: number
  ): Promise<ApiResponse<PaginationResponse<any>>> {
    try {
      const cacheKey = `be:courses:list:major=${major ?? ''}|sem=${semester ?? ''}|page=${params.page}|size=${params.size}`;
      if (process.env.REDIS_ENABLED === 'true') {
        const cached = await get(cacheKey);
        if (cached) return JSON.parse(cached) as ApiResponse<PaginationResponse<any>>;
      }

      const where: WhereOptions = { status: StatusEnum.Active };
      if (major) {
        (where as any).available_majors = { [Op.contains]: [major] };
      }
      if (semester) {
        (where as any).semester = semester;
      }

      const result = await this.findAllWithPagination(params, where);
      if (process.env.REDIS_ENABLED === 'true' && result.code === 200) {
        await set(cacheKey, JSON.stringify(result), 120);
      }
      return result;
    } catch (error) {
      return this.handleError(error, '获取课程列表失败');
    }
  }

  async getCourseDetail(courseId: number): Promise<ApiResponse<any>> {
    try {
      const cacheKey = `be:course:detail:${courseId}`;
      if (process.env.REDIS_ENABLED === 'true') {
        const cached = await get(cacheKey);
        if (cached) return JSON.parse(cached) as ApiResponse<any>;
      }

      const course = await this.courseModel.findByPk(courseId, {
        include: [
          { model: this.teacherModel, through: { attributes: [] } },
          { model: this.classModel, where: { status: StatusEnum.Active }, required: false },
          { model: this.timeSlotModel },
        ],
      });

      if (!course) {
        return { code: 404, message: '课程不存在' };
      }

      const resp: ApiResponse<any> = {
        code: 200,
        message: '获取课程详情成功',
        data: course,
      };

      if (process.env.REDIS_ENABLED === 'true') {
        await set(cacheKey, JSON.stringify(resp), 300);
      }
      return resp;
    } catch (error) {
      return this.handleError(error, '获取课程详情失败');
    }
  }

  async getCoursesBySemester(academicYear: number, semester: number): Promise<ApiResponse<any[]>> {
    try {
      const cacheKey = `be:courses:semester:${academicYear}:${semester}`;
      if (process.env.REDIS_ENABLED === 'true') {
        const cached = await get(cacheKey);
        if (cached) return JSON.parse(cached) as ApiResponse<any[]>;
      }

      const courses = await this.courseModel.findAll({
        where: {
          academic_year: academicYear,
          semester,
          status: StatusEnum.Active,
        },
        order: [['course_name', 'ASC']],
      });

      const resp: ApiResponse<any[]> = {
        code: 200,
        message: '获取学期课程成功',
        data: courses,
      };

      if (process.env.REDIS_ENABLED === 'true') {
        await set(cacheKey, JSON.stringify(resp), 300);
      }
      return resp;
    } catch (error) {
      return this.handleError(error, '获取学期课程失败');
    }
  }

  async getTeacherCourses(
    teacherId: number,
    params: PaginationParams
  ): Promise<ApiResponse<PaginationResponse<any>>> {
    try {
      const cacheKey = `be:courses:teacher:${teacherId}:page=${params.page}|size=${params.size}`;
      if (process.env.REDIS_ENABLED === 'true') {
        const cached = await get(cacheKey);
        if (cached) return JSON.parse(cached) as ApiResponse<PaginationResponse<any>>;
      }

      const teacher = await this.teacherModel.findByPk(teacherId);
      if (!teacher) {
        return { code: 404, message: '教师不存在' };
      }

      const courseTeachers = await this.courseTeacherModel.findAll({
        where: { teacher_id: teacherId },
      });

      const courseIds = courseTeachers.map((ct: any) => ct.course_id);

      if (courseIds.length === 0) {
        const empty: PaginationResponse<any> = {
          data: [],
          total: 0,
          page: params.page,
          size: params.size,
          totalPages: 0,
        };
        return { code: 200, message: '获取教师课程成功', data: empty };
      }

      const result = await this.findAllWithPagination(params, {
        id: { [Op.in]: courseIds },
        status: StatusEnum.Active,
      });

      if (process.env.REDIS_ENABLED === 'true' && result.code === 200) {
        await set(cacheKey, JSON.stringify(result), 120);
      }

      return result;
    } catch (error) {
      return this.handleError(error, '获取教师课程失败');
    }
  }

  async getClassStudents(
    classId: number,
    params: PaginationParams
  ): Promise<ApiResponse<PaginationResponse<any>>> {
    try {
      const classInstance = await this.classModel.findByPk(classId, {
        include: [{ model: this.userModel, through: { attributes: [] } }],
      });

      if (!classInstance) {
        return { code: 404, message: '班级不存在' } as ApiResponse<PaginationResponse<any>>;
      }

      const students = (classInstance as any).Users ?? [];
      const { page, size } = params;
      const total = students.length;
      const totalPages = total === 0 ? 0 : Math.ceil(total / size);
      const offset = (page - 1) * size;
      const pageData = students.slice(offset, offset + size);

      const payload: PaginationResponse<any> = {
        data: pageData,
        total,
        page,
        size,
        totalPages,
      };

      return { code: 200, message: '获取班级学生成功', data: payload };
    } catch (error) {
      return this.handleError(error, '获取班级学生失败');
    }
  }

  async updateCourseStatus(courseId: number, status: Status): Promise<ApiResponse<any>> {
    try {
      const [affectedCount, affectedRows] = await this.courseModel.update(
        { status },
        { where: { id: courseId }, returning: true }
      );

      if (affectedCount === 0) {
        return { code: 404, message: '课程不存在' };
      }

      const resp: ApiResponse<any> = {
        code: 200,
        message: '课程状态更新成功',
        data: affectedRows[0],
      };

      if (process.env.REDIS_ENABLED === 'true') {
        await del(`be:course:detail:${courseId}`);
      }

      return resp;
    } catch (error) {
      return this.handleError(error, '课程状态更新失败');
    }
  }

  async findAllWithPagination(
    params: PaginationParams,
    where?: WhereOptions
  ): Promise<ApiResponse<PaginationResponse<any>>> {
    try {
      const { page, size } = params;
      const offset = (page - 1) * size;

      const { count, rows } = await this.courseModel.findAndCountAll({
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

      return { code: 200, message: '查询成功', data: payload };
    } catch (error) {
      return this.handleError(error, '查询失败');
    }
  }

  private handleError(error: unknown, message: string): ApiResponse {
    this.logger.error(message, error instanceof Error ? error.stack : undefined);
    return { code: 500, message };
  }
}
