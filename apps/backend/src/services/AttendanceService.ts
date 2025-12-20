/**
 * 考勤服务类
 * 处理考勤相关的业务逻辑，包括考勤任务管理、打卡记录、统计分析等
 */
import { Op, WhereOptions } from 'sequelize';
import {
  AttendanceStatus,
  CreateAttendanceTaskInput,
  ApiResponse,
  PaginationParams,
  PaginationResponse,
  Status,
} from '@csisp/types';
import { BaseService } from './BaseService';
import { get, set, del } from '@csisp/redis';

export class AttendanceService extends BaseService {
  private attendanceRecordModel: any;
  private classModel: any;
  private userModel: any;
  private courseModel: any;

  constructor(
    attendanceTaskModel: any,
    attendanceRecordModel: any,
    classModel: any,
    userModel: any,
    courseModel: any
  ) {
    super(attendanceTaskModel);
    this.attendanceRecordModel = attendanceRecordModel;
    this.classModel = classModel;
    this.userModel = userModel;
    this.courseModel = courseModel;
  }

  /**
   * 创建考勤任务
   * @param taskData 考勤任务数据
   * @returns 创建结果
   */
  async createAttendanceTask(taskData: CreateAttendanceTaskInput): Promise<ApiResponse<any>> {
    try {
      // 检查班级是否存在
      const classInstance = await this.classModel.findByPk(taskData.classId);
      if (!classInstance) {
        return {
          code: 404,
          message: '班级不存在',
        } as ApiResponse<any>;
      }

      // 检查时间有效性
      const now = new Date();
      if (new Date(taskData.startTime) < now) {
        return {
          code: 400,
          message: '开始时间不能早于当前时间',
        } as ApiResponse<any>;
      }

      if (new Date(taskData.endTime) <= new Date(taskData.startTime)) {
        return {
          code: 400,
          message: '结束时间必须晚于开始时间',
        } as ApiResponse<any>;
      }

      // 处理字段映射
      const task = await this.model.create({
        course_id: classInstance.course_id, // 字段映射
        task_name: taskData.taskName, // 字段映射
        task_type: taskData.taskType, // 字段映射
        start_time: taskData.startTime, // 字段映射
        end_time: taskData.endTime, // 字段映射
        status: taskData.status,
      });

      return {
        code: 201,
        message: '考勤任务创建成功',
        data: task,
      };
    } catch (error) {
      return this.handleError(error, '考勤任务创建失败') as ApiResponse<any>;
    }
  }

  /**
   * 学生打卡
   * @param taskId 考勤任务ID
   * @param userId 用户ID
   * @param status 考勤状态
   * @param remark 备注
   * @returns 打卡结果
   */
  async checkIn(
    taskId: number,
    userId: number,
    status: AttendanceStatus = AttendanceStatus.Normal,
    remark?: string
  ): Promise<ApiResponse<any>> {
    try {
      // 检查考勤任务是否存在
      const task = await this.model.findByPk(taskId);
      if (!task) {
        return {
          code: 404,
          message: '考勤任务不存在',
        };
      }

      // 检查任务状态
      if (task.status !== Status.Active) {
        return {
          code: 400,
          message: '考勤任务未激活',
        };
      }

      // 检查是否在有效时间内
      const now = new Date();
      const startTime = new Date(task.startTime);
      const endTime = new Date(task.endTime);

      if (now < startTime) {
        return {
          code: 400,
          message: '考勤尚未开始',
        };
      }

      if (now > endTime) {
        return {
          code: 400,
          message: '考勤已结束',
        };
      }

      // 检查用户是否已打卡
      const existingRecord = await this.attendanceRecordModel.findOne({
        where: {
          task_id: taskId,
          user_id: userId,
        },
      });

      if (existingRecord) {
        return {
          code: 409,
          message: '您已打过卡，请勿重复打卡',
        };
      }

      // 检查用户是否属于该班级
      const userClass = await this.classModel.findOne({
        include: [
          {
            model: this.userModel,
            where: { id: userId },
            through: { attributes: [] },
          },
        ],
        where: { id: task.classId },
      });

      if (!userClass) {
        return {
          code: 403,
          message: '您不属于该班级，无法打卡',
        };
      }

      // 创建打卡记录
      const record = await this.attendanceRecordModel.create({
        task_id: taskId,
        user_id: userId,
        status: status,
        remark: remark || '',
      });

      const resp = {
        code: 201,
        message: '打卡成功',
        data: record,
      };
      if (process.env.REDIS_ENABLED === 'true') {
        const task = await this.model.findByPk(taskId);
        const classId = task?.classId;
        if (classId) await del(`be:attendance:stats:class:${classId}`);
        await del(`be:attendance:stats:student:${userId}`);
        if (classId) await del(`be:attendance:stats:student:${userId}:class:${classId}`);
      }
      return resp;
    } catch (error) {
      return this.handleError(error, '打卡失败');
    }
  }

  /**
   * 获取班级的考勤任务
   * @param classId 班级ID
   * @param params 分页参数
   * @returns 考勤任务列表
   */
  async getClassAttendanceTasks(
    classId: number,
    params: PaginationParams
  ): Promise<ApiResponse<PaginationResponse<any>>> {
    try {
      const cacheKey = `be:attendance:tasks:class:${classId}:page=${params.page}|size=${params.size}`;
      if (process.env.REDIS_ENABLED === 'true') {
        const cached = await get(cacheKey);
        if (cached) return JSON.parse(cached) as ApiResponse<PaginationResponse<any>>;
      }
      // 检查班级是否存在
      const classInstance = await this.classModel.findByPk(classId);
      if (!classInstance) {
        return {
          code: 404,
          message: '班级不存在',
        };
      }

      const result = await this.findAllWithPagination(params, {
        course_id: classInstance.course_id, // 注意字段映射
        status: Status.Active,
      });
      if (process.env.REDIS_ENABLED === 'true' && result.code === 200) {
        await set(cacheKey, JSON.stringify(result), 120);
      }
      return result;
    } catch (error) {
      return this.handleError<PaginationResponse<any>>(error, '获取班级考勤任务失败');
    }
  }

  /**
   * 获取考勤任务的打卡记录
   * @param taskId 考勤任务ID
   * @param params 分页参数
   * @returns 打卡记录列表
   */
  async getAttendanceRecords(
    taskId: number,
    params: PaginationParams
  ): Promise<ApiResponse<PaginationResponse<any>>> {
    try {
      const cacheKey = `be:attendance:records:task:${taskId}:page=${params.page}|size=${params.size}`;
      if (process.env.REDIS_ENABLED === 'true') {
        const cached = await get(cacheKey);
        if (cached) return JSON.parse(cached) as ApiResponse<PaginationResponse<any>>;
      }
      // 检查考勤任务是否存在
      const task = await this.model.findByPk(taskId);
      if (!task) {
        return {
          code: 404,
          message: '考勤任务不存在',
        };
      }

      const { page, size } = params;
      const offset = (page - 1) * size;

      const { count, rows } = await this.attendanceRecordModel.findAndCountAll({
        where: { task_id: taskId },
        include: [
          {
            model: this.userModel,
            attributes: ['id', 'username', 'real_name', 'student_id'], // 注意字段映射
          },
        ],
        limit: size,
        offset,
        order: [['created_at', 'DESC']], // 注意字段映射
      });

      const totalPages = Math.ceil(count / size);

      const resp = {
        code: 200,
        message: '获取打卡记录成功',
        data: {
          data: rows,
          total: count,
          page,
          size,
          totalPages,
        },
      };
      if (process.env.REDIS_ENABLED === 'true') {
        await set(cacheKey, JSON.stringify(resp), 120);
      }
      return resp;
    } catch (error) {
      return this.handleError<PaginationResponse<any>>(error, '获取打卡记录失败');
    }
  }

  /**
   * 获取学生的考勤统计
   * @param userId 用户ID
   * @param classId 班级ID（可选）
   * @returns 考勤统计信息
   */
  async getStudentAttendanceStats(userId: number, classId?: number): Promise<ApiResponse<any>> {
    try {
      const keyBase = classId
        ? `be:attendance:stats:student:${userId}:class:${classId}`
        : `be:attendance:stats:student:${userId}`;
      if (process.env.REDIS_ENABLED === 'true') {
        const cached = await get(keyBase);
        if (cached) return JSON.parse(cached) as ApiResponse<any>;
      }
      const where: WhereOptions = { user_id: userId }; // 注意字段映射

      if (classId) {
        const classInstance = await this.classModel.findByPk(classId);
        if (!classInstance) {
          return {
            code: 404,
            message: '班级不存在',
          } as ApiResponse<any>;
        }

        const classTasks = await this.model.findAll({
          where: { course_id: classInstance.course_id },
          attributes: ['id'],
        });
        const taskIds = classTasks.map((task: any) => task.id);

        if (taskIds.length === 0) {
          return {
            code: 200,
            message: '获取学生考勤统计成功',
            data: {
              studentId: userId,
              studentName: '',
              totalCount: 0,
              normalCount: 0,
              lateCount: 0,
              absentCount: 0,
              leaveCount: 0,
              rate: 0,
            },
          };
        }

        (where as any).task_id = { [Op.in]: taskIds };
      }

      const records = await this.attendanceRecordModel.findAll({
        where,
        include: [
          {
            model: this.userModel,
            attributes: ['real_name'], // 注意字段映射
          },
        ],
      });

      const totalCount = records.length;
      const normalCount = records.filter((r: any) => r.status === AttendanceStatus.Normal).length;
      const lateCount = records.filter((r: any) => r.status === AttendanceStatus.Late).length;
      const absentCount = records.filter((r: any) => r.status === AttendanceStatus.Absent).length;
      const leaveCount = records.filter((r: any) => r.status === AttendanceStatus.Leave).length;
      const rate = totalCount > 0 ? (normalCount / totalCount) * 100 : 0;

      const resp = {
        code: 200,
        message: '获取学生考勤统计成功',
        data: {
          studentId: userId,
          studentName: records[0]?.User?.real_name || '', // 注意字段映射
          totalCount,
          normalCount,
          lateCount,
          absentCount,
          leaveCount,
          rate: Math.round(rate * 100) / 100,
        },
      };
      if (process.env.REDIS_ENABLED === 'true') {
        await set(keyBase, JSON.stringify(resp), 60);
      }
      return resp;
    } catch (error) {
      return this.handleError(error, '获取学生考勤统计失败');
    }
  }

  /**
   * 获取班级的考勤统计
   * @param classId 班级ID
   * @returns 班级考勤统计信息
   */
  async getClassAttendanceStats(classId: number): Promise<ApiResponse<any>> {
    try {
      const cacheKey = `be:attendance:stats:class:${classId}`;
      if (process.env.REDIS_ENABLED === 'true') {
        const cached = await get(cacheKey);
        if (cached) return JSON.parse(cached) as ApiResponse<any>;
      }
      // 检查班级是否存在
      const classInstance = await this.classModel.findByPk(classId);
      if (!classInstance) {
        return {
          code: 404,
          message: '班级不存在',
        };
      }

      // 获取班级的所有考勤任务
      const tasks = await this.model.findAll({
        where: { course_id: classInstance.course_id },
      });

      const taskIds = tasks.map((task: any) => task.id);

      if (taskIds.length === 0) {
        return {
          code: 200,
          message: '获取班级考勤统计成功',
          data: {
            totalCount: 0,
            normalCount: 0,
            lateCount: 0,
            absentCount: 0,
            leaveCount: 0,
            rate: 0,
          },
        };
      }

      const records = await this.attendanceRecordModel.findAll({
        where: { task_id: { [Op.in]: taskIds } },
      });

      const totalCount = records.length;
      const normalCount = records.filter((r: any) => r.status === AttendanceStatus.Normal).length;
      const lateCount = records.filter((r: any) => r.status === AttendanceStatus.Late).length;
      const absentCount = records.filter((r: any) => r.status === AttendanceStatus.Absent).length;
      const leaveCount = records.filter((r: any) => r.status === AttendanceStatus.Leave).length;
      const rate = totalCount > 0 ? (normalCount / totalCount) * 100 : 0;

      const resp = {
        code: 200,
        message: '获取班级考勤统计成功',
        data: {
          totalCount,
          normalCount,
          lateCount,
          absentCount,
          leaveCount,
          rate: Math.round(rate * 100) / 100,
        },
      };
      if (process.env.REDIS_ENABLED === 'true') {
        await set(cacheKey, JSON.stringify(resp), 60);
      }
      return resp;
    } catch (error) {
      return this.handleError(error, '获取班级考勤统计失败');
    }
  }

  /**
   * 更新考勤记录
   * @param recordId 记录ID
   * @param updateData 更新数据
   * @returns 更新结果
   */
  async updateAttendanceRecord(recordId: number, updateData: any): Promise<ApiResponse<any>> {
    try {
      const result = await this.attendanceRecordModel.update(updateData, {
        where: { id: recordId },
        returning: true,
      });

      if (result[0] === 0) {
        return {
          code: 404,
          message: '考勤记录不存在',
        };
      }

      const resp = {
        code: 200,
        message: '考勤记录更新成功',
        data: result[1][0],
      };
      if (process.env.REDIS_ENABLED === 'true') {
        // 粗粒度失效：班级与学生统计（如可得）
        const rec: any = resp.data;
        const task = await this.model.findByPk(rec.task_id);
        const classId = task?.classId;
        const userId = rec.user_id;
        if (classId) await del(`be:attendance:stats:class:${classId}`);
        if (userId && classId) await del(`be:attendance:stats:student:${userId}:class:${classId}`);
        if (userId) await del(`be:attendance:stats:student:${userId}`);
      }
      return resp;
    } catch (error) {
      return this.handleError(error, '考勤记录更新失败');
    }
  }

  /**
   * 获取当前活跃的考勤任务
   * @param classId 班级ID（可选）
   * @returns 活跃考勤任务列表
   */
  async getActiveAttendanceTasks(classId?: number): Promise<ApiResponse<any[]>> {
    try {
      const now = new Date();
      const where: WhereOptions = {
        status: Status.Active,
        start_time: { [Op.lte]: now }, // 注意字段映射
        end_time: { [Op.gte]: now }, // 注意字段映射
      };

      if (classId) {
        const classInstance = await this.classModel.findByPk(classId);
        if (!classInstance) {
          return {
            code: 404,
            message: '班级不存在',
          } as ApiResponse<any[]>;
        }
        (where as any).course_id = classInstance.course_id;
      }
      let cacheKey = `be:attendance:active`;
      if (classId) cacheKey = `be:attendance:active:class:${classId}`;
      if (process.env.REDIS_ENABLED === 'true') {
        const cached = await get(cacheKey);
        if (cached) return JSON.parse(cached) as ApiResponse<any[]>;
      }
      const tasks = await this.model.findAll({
        where,
        include: [
          {
            model: this.courseModel,
            attributes: ['id', 'course_name'],
          },
        ],
        order: [['start_time', 'ASC']], // 注意字段映射
      });

      const resp = {
        code: 200,
        message: '获取活跃考勤任务成功',
        data: tasks,
      };
      if (process.env.REDIS_ENABLED === 'true') {
        await set(cacheKey, JSON.stringify(resp), 30);
      }
      return resp;
    } catch (error) {
      return this.handleError<any[]>(error, '获取活跃考勤任务失败');
    }
  }
}
