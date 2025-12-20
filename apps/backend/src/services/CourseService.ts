/**
 * 课程服务类
 * 处理课程相关的业务逻辑，包括课程管理、教师分配、班级管理等
 */
import { Op, WhereOptions } from 'sequelize';
import {
  CreateCourseInput,
  CreateClassInput,
  CreateTimeSlotInput,
  CreateSubCourseInput,
  ApiResponse,
  PaginationParams,
  PaginationResponse,
  Status,
} from '@csisp/types';
import { BaseService } from './BaseService';
import { get, set, del } from '@csisp/redis';

export class CourseService extends BaseService {
  private courseTeacherModel: any;
  private teacherModel: any;
  private classModel: any;
  private timeSlotModel: any;
  private subCourseModel: any;

  constructor(
    courseModel: any,
    courseTeacherModel: any,
    teacherModel: any,
    classModel: any,
    timeSlotModel: any,
    subCourseModel: any
  ) {
    super(courseModel);
    this.courseTeacherModel = courseTeacherModel;
    this.teacherModel = teacherModel;
    this.classModel = classModel;
    this.timeSlotModel = timeSlotModel;
    this.subCourseModel = subCourseModel;
  }

  /**
   * 创建课程
   * @param courseData 课程数据
   * @returns 创建结果
   */
  async createCourse(courseData: CreateCourseInput): Promise<ApiResponse<any>> {
    try {
      // 检查课程代码是否已存在
      const existingCourse = await this.model.findOne({
        where: { course_code: courseData.courseCode }, // 注意字段映射
      });

      if (existingCourse) {
        return {
          code: 409,
          message: '课程代码已存在',
        } as ApiResponse<any>;
      }

      // 处理字段映射
      const course = await this.model.create({
        course_name: courseData.courseName, // 字段映射
        course_code: courseData.courseCode, // 字段映射
        semester: courseData.semester,
        academic_year: courseData.academicYear, // 字段映射
        available_majors: courseData.availableMajors, // 字段映射
        status: courseData.status,
      });

      return {
        code: 201,
        message: '课程创建成功',
        data: course,
      };
    } catch (error) {
      return this.handleError(error, '课程创建失败') as ApiResponse<any>;
    }
  }

  /**
   * 为课程分配教师
   * @param courseId 课程ID
   * @param teacherIds 教师ID数组
   * @returns 分配结果
   */
  async assignTeachers(courseId: number, teacherIds: number[]): Promise<ApiResponse<boolean>> {
    try {
      // 检查课程是否存在
      const course = await this.model.findByPk(courseId);
      if (!course) {
        return {
          code: 404,
          message: '课程不存在',
        } as ApiResponse<boolean>;
      }

      // 检查教师是否存在
      const teachers = await this.teacherModel.findAll({
        where: { id: { [Op.in]: teacherIds } },
      });

      if (teachers.length !== teacherIds.length) {
        return {
          code: 404,
          message: '部分教师不存在',
        } as ApiResponse<boolean>;
      }

      // 删除现有教师关联
      await this.courseTeacherModel.destroy({
        where: { course_id: courseId }, // 注意字段映射
      });

      // 创建新的教师关联
      if (teacherIds.length > 0) {
        const courseTeachers = teacherIds.map(teacherId => ({
          course_id: courseId, // 注意字段映射
          teacher_id: teacherId, // 注意字段映射
        }));

        await this.courseTeacherModel.bulkCreate(courseTeachers);
      }

      return {
        code: 200,
        message: '教师分配成功',
        data: true,
      };
    } catch (error) {
      return this.handleError(error, '教师分配失败') as ApiResponse<boolean>;
    }
  }

  /**
   * 创建班级
   * @param classData 班级数据
   * @returns 创建结果
   */
  async createClass(classData: CreateClassInput): Promise<ApiResponse<any>> {
    try {
      // 检查课程是否存在
      const course = await this.model.findByPk(classData.courseId);
      if (!course) {
        return {
          code: 404,
          message: '课程不存在',
        } as ApiResponse<any>;
      }

      // 检查教师是否存在
      const teacher = await this.teacherModel.findByPk(classData.teacherId);
      if (!teacher) {
        return {
          code: 404,
          message: '教师不存在',
        } as ApiResponse<any>;
      }

      // 处理字段映射
      const classInstance = await this.classModel.create({
        class_name: classData.className, // 字段映射
        course_id: classData.courseId, // 字段映射
        teacher_id: classData.teacherId, // 字段映射
        semester: classData.semester,
        academic_year: classData.academicYear, // 字段映射
        max_students: classData.maxStudents, // 字段映射
        status: classData.status,
      });

      return {
        code: 201,
        message: '班级创建成功',
        data: classInstance,
      };
    } catch (error) {
      return this.handleError(error, '班级创建失败') as ApiResponse<any>;
    }
  }

  /**
   * 创建时间段
   * @param timeSlotData 时间段数据
   * @returns 创建结果
   */
  async createTimeSlot(timeSlotData: CreateTimeSlotInput): Promise<ApiResponse<any>> {
    try {
      // 检查子课程是否存在
      const subCourse = await this.subCourseModel.findByPk(timeSlotData.subCourseId);
      if (!subCourse) {
        return {
          code: 404,
          message: '子课程不存在',
        } as ApiResponse<any>;
      }

      // 处理字段映射
      const timeSlot = await this.timeSlotModel.create({
        sub_course_id: timeSlotData.subCourseId, // 字段映射
        weekday: timeSlotData.weekday,
        start_time: timeSlotData.startTime, // 字段映射
        end_time: timeSlotData.endTime, // 字段映射
        location: timeSlotData.location,
        status: timeSlotData.status,
      });

      return {
        code: 201,
        message: '时间段创建成功',
        data: timeSlot,
      };
    } catch (error) {
      return this.handleError(error, '时间段创建失败') as ApiResponse<any>;
    }
  }

  /**
   * 创建子课程
   * @param subCourseData 子课程数据
   * @returns 创建结果
   */
  async createSubCourse(subCourseData: CreateSubCourseInput): Promise<ApiResponse<any>> {
    try {
      // 检查课程是否存在
      const course = await this.model.findByPk(subCourseData.courseId);
      if (!course) {
        return {
          code: 404,
          message: '课程不存在',
        } as ApiResponse<any>;
      }

      // 检查教师是否存在
      const teacher = await this.teacherModel.findByPk(subCourseData.teacherId);
      if (!teacher) {
        return {
          code: 404,
          message: '教师不存在',
        } as ApiResponse<any>;
      }

      // 处理字段映射
      const subCourse = await this.subCourseModel.create({
        course_id: subCourseData.courseId, // 字段映射
        sub_course_code: subCourseData.subCourseCode, // 字段映射
        teacher_id: subCourseData.teacherId, // 字段映射
        academic_year: subCourseData.academicYear, // 字段映射
        status: subCourseData.status,
      });

      return {
        code: 201,
        message: '子课程创建成功',
        data: subCourse,
      };
    } catch (error) {
      return this.handleError(error, '子课程创建失败') as ApiResponse<any>;
    }
  }

  /**
   * 获取课程列表（支持专业筛选）
   * @param params 分页参数
   * @param major 专业筛选
   * @param semester 学期筛选
   * @returns 课程列表
   */
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
      const where: WhereOptions = { status: Status.Active };

      if (major) {
        where.available_majors = {
          // 注意字段映射
          [Op.contains]: [major],
        };
      }

      if (semester) {
        where.semester = semester;
      }

      const result = await this.findAllWithPagination(params, where);
      if (process.env.REDIS_ENABLED === 'true' && result.code === 200) {
        await set(cacheKey, JSON.stringify(result), 120);
      }
      return result;
    } catch (error) {
      return this.handleError(error, '获取课程列表失败') as ApiResponse<PaginationResponse<any>>;
    }
  }

  /**
   * 获取课程的详细信息（包含教师、班级等）
   * @param courseId 课程ID
   * @returns 课程详细信息
   */
  async getCourseDetail(courseId: number): Promise<ApiResponse<any>> {
    try {
      const cacheKey = `be:course:detail:${courseId}`;
      if (process.env.REDIS_ENABLED === 'true') {
        const cached = await get(cacheKey);
        if (cached) return JSON.parse(cached) as ApiResponse<any>;
      }
      const course = await this.model.findByPk(courseId, {
        include: [
          {
            model: this.teacherModel,
            through: { attributes: [] },
          },
          {
            model: this.classModel,
            where: { status: Status.Active },
            required: false,
          },
          {
            model: this.timeSlotModel,
          },
        ],
      });

      if (!course) {
        return {
          code: 404,
          message: '课程不存在',
        };
      }

      const resp = {
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

  /**
   * 获取指定学期的课程
   * @param academicYear 学年
   * @param semester 学期
   * @returns 课程列表
   */
  async getCoursesBySemester(academicYear: number, semester: number): Promise<ApiResponse<any[]>> {
    try {
      const cacheKey = `be:courses:semester:${academicYear}:${semester}`;
      if (process.env.REDIS_ENABLED === 'true') {
        const cached = await get(cacheKey);
        if (cached) return JSON.parse(cached) as ApiResponse<any[]>;
      }
      const courses = await this.model.findAll({
        where: {
          academic_year: academicYear, // 注意字段映射
          semester,
          status: Status.Active,
        },
        order: [['course_name', 'ASC']], // 注意字段映射
      });

      const resp = {
        code: 200,
        message: '获取学期课程成功',
        data: courses,
      };
      if (process.env.REDIS_ENABLED === 'true') {
        await set(cacheKey, JSON.stringify(resp), 300);
      }
      return resp;
    } catch (error) {
      return this.handleError(error, '获取学期课程失败') as ApiResponse<any[]>;
    }
  }

  /**
   * 获取教师授课列表
   * @param teacherId 教师ID
   * @param params 分页参数
   * @returns 教师授课列表
   */
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
      // 检查教师是否存在
      const teacher = await this.teacherModel.findByPk(teacherId);
      if (!teacher) {
        return {
          code: 404,
          message: '教师不存在',
        } as ApiResponse<PaginationResponse<any>>;
      }

      // 获取教师关联的课程ID
      const courseTeachers = await this.courseTeacherModel.findAll({
        where: { teacher_id: teacherId }, // 注意字段映射
      });

      const courseIds = courseTeachers.map((ct: any) => ct.course_id); // 注意字段映射

      if (courseIds.length === 0) {
        return {
          code: 200,
          message: '获取教师课程成功',
          data: {
            data: [],
            total: 0,
            page: params.page,
            size: params.size,
            totalPages: 0,
          },
        };
      }

      const result = await this.findAllWithPagination(params, {
        id: { [Op.in]: courseIds },
        status: Status.Active,
      });
      if (process.env.REDIS_ENABLED === 'true' && result.code === 200) {
        await set(cacheKey, JSON.stringify(result), 120);
      }
      return result;
    } catch (error) {
      return this.handleError(error, '获取教师课程失败') as ApiResponse<PaginationResponse<any>>;
    }
  }

  /**
   * 更新课程状态
   * @param courseId 课程ID
   * @param status 状态
   * @returns 更新结果
   */
  async updateCourseStatus(courseId: number, status: Status): Promise<ApiResponse<any>> {
    try {
      const result = await this.update(courseId, { status });

      if (result.code === 404) {
        return result;
      }

      const resp = {
        code: 200,
        message: '课程状态更新成功',
        data: result.data!,
      };
      if (process.env.REDIS_ENABLED === 'true') {
        await del(`be:course:detail:${courseId}`);
      }
      return resp;
    } catch (error) {
      return this.handleError(error, '课程状态更新失败');
    }
  }
}
