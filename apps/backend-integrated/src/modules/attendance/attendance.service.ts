import { Inject, Injectable, Logger } from '@nestjs/common';
import { Op, type WhereOptions } from 'sequelize';
import type {
  ApiResponse,
  CreateAttendanceTaskInput,
  PaginationParams,
  PaginationResponse,
} from '@csisp/types';
import { AttendanceStatus, Status as StatusEnum } from '@csisp/types';
import { get, set, del } from '@infra/redis';
import { POSTGRES_MODELS } from '@infra/postgres/postgres.providers';

type ModelsDict = Record<string, any>;

/**
 * 考勤领域服务
 *
 * 负责考勤任务管理、打卡记录与统计分析等能力。
 */
@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  // 预留模型引用，后续补全业务逻辑时使用
  private readonly taskModel: any;
  private readonly recordModel: any;
  private readonly classModel: any;
  private readonly userModel: any;
  private readonly courseModel: any;

  constructor(@Inject(POSTGRES_MODELS) models: ModelsDict) {
    this.taskModel = models.AttendanceTask;
    this.recordModel = models.AttendanceRecord;
    this.classModel = models.Class;
    this.userModel = models.User;
    this.courseModel = models.Course;
  }

  async createAttendanceTask(input: CreateAttendanceTaskInput): Promise<ApiResponse<any>> {
    try {
      const classInstance = await this.classModel.findByPk(input.classId);
      if (!classInstance) {
        return { code: 404, message: '班级不存在' };
      }

      const now = new Date();
      if (new Date(input.startTime) < now) {
        return { code: 400, message: '开始时间不能早于当前时间' };
      }
      if (new Date(input.endTime) <= new Date(input.startTime)) {
        return { code: 400, message: '结束时间必须晚于开始时间' };
      }

      const task = await this.taskModel.create({
        course_id: classInstance.course_id,
        task_name: input.taskName,
        task_type: input.taskType,
        start_time: input.startTime,
        end_time: input.endTime,
        status: input.status ?? StatusEnum.Active,
      });

      return { code: 201, message: '考勤任务创建成功', data: task };
    } catch (error) {
      return this.handleError(error, '考勤任务创建失败');
    }
  }

  async checkIn(
    userId: number,
    taskId: number,
    status: AttendanceStatus = AttendanceStatus.Normal,
    remark?: string
  ): Promise<ApiResponse<any>> {
    try {
      const task = await this.taskModel.findByPk(taskId);
      if (!task) {
        return { code: 404, message: '考勤任务不存在' };
      }

      if (task.status !== StatusEnum.Active) {
        return { code: 400, message: '考勤任务未激活' };
      }

      const now = new Date();
      const startTime = new Date(task.startTime);
      const endTime = new Date(task.endTime);

      if (now < startTime) {
        return { code: 400, message: '考勤尚未开始' };
      }
      if (now > endTime) {
        return { code: 400, message: '考勤已结束' };
      }

      const existingRecord = await this.recordModel.findOne({
        where: { task_id: taskId, user_id: userId },
      });
      if (existingRecord) {
        return { code: 409, message: '您已打过卡，请勿重复打卡' };
      }

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
        return { code: 403, message: '您不属于该班级，无法打卡' };
      }

      const record = await this.recordModel.create({
        task_id: taskId,
        user_id: userId,
        status,
        remark: remark ?? '',
      });

      const resp: ApiResponse<any> = {
        code: 201,
        message: '打卡成功',
        data: record,
      };

      if (process.env.REDIS_ENABLED === 'true') {
        const taskReloaded = await this.taskModel.findByPk(taskId);
        const classId = taskReloaded?.classId;
        if (classId) await del(`be:attendance:stats:class:${classId}`);
        await del(`be:attendance:stats:student:${userId}`);
        if (classId) {
          await del(`be:attendance:stats:student:${userId}:class:${classId}`);
        }
      }

      return resp;
    } catch (error) {
      return this.handleError(error, '打卡失败');
    }
  }

  async getClassAttendanceTasks(
    classId: number,
    pagination: PaginationParams
  ): Promise<ApiResponse<PaginationResponse<any>>> {
    try {
      const cacheKey = `be:attendance:tasks:class:${classId}:page=${pagination.page}|size=${pagination.size}`;
      if (process.env.REDIS_ENABLED === 'true') {
        const cached = await get(cacheKey);
        if (cached) return JSON.parse(cached) as ApiResponse<PaginationResponse<any>>;
      }

      const classInstance = await this.classModel.findByPk(classId);
      if (!classInstance) {
        return { code: 404, message: '班级不存在' } as ApiResponse<PaginationResponse<any>>;
      }

      const result = await this.findAllWithPagination(pagination, {
        course_id: classInstance.course_id,
        status: StatusEnum.Active,
      });

      if (process.env.REDIS_ENABLED === 'true' && result.code === 200) {
        await set(cacheKey, JSON.stringify(result), 120);
      }
      return result;
    } catch (error) {
      return this.handleError<PaginationResponse<any>>(error, '获取班级考勤任务失败');
    }
  }

  async getActiveAttendanceTasks(): Promise<ApiResponse<any[]>> {
    try {
      const now = new Date();
      const where: WhereOptions = {
        status: StatusEnum.Active,
        start_time: { [Op.lte]: now },
        end_time: { [Op.gte]: now },
      };

      const cacheKey = 'be:attendance:active';
      if (process.env.REDIS_ENABLED === 'true') {
        const cached = await get(cacheKey);
        if (cached) return JSON.parse(cached) as ApiResponse<any[]>;
      }

      const tasks = await this.taskModel.findAll({
        where,
        include: [
          {
            model: this.courseModel,
            attributes: ['id', 'course_name'],
          },
        ],
        order: [['start_time', 'ASC']],
      });

      const resp: ApiResponse<any[]> = {
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

  async getTaskRecords(
    taskId: number,
    pagination: PaginationParams
  ): Promise<ApiResponse<PaginationResponse<any>>> {
    try {
      const cacheKey = `be:attendance:records:task:${taskId}:page=${pagination.page}|size=${pagination.size}`;
      if (process.env.REDIS_ENABLED === 'true') {
        const cached = await get(cacheKey);
        if (cached) return JSON.parse(cached) as ApiResponse<PaginationResponse<any>>;
      }

      const task = await this.taskModel.findByPk(taskId);
      if (!task) {
        return { code: 404, message: '考勤任务不存在' } as ApiResponse<PaginationResponse<any>>;
      }

      const { page, size } = pagination;
      const offset = (page - 1) * size;

      const { count, rows } = await this.recordModel.findAndCountAll({
        where: { task_id: taskId },
        include: [
          {
            model: this.userModel,
            attributes: ['id', 'username', 'real_name', 'student_id'],
          },
        ],
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

      const resp: ApiResponse<PaginationResponse<any>> = {
        code: 200,
        message: '获取打卡记录成功',
        data: payload,
      };

      if (process.env.REDIS_ENABLED === 'true') {
        await set(cacheKey, JSON.stringify(resp), 120);
      }

      return resp;
    } catch (error) {
      return this.handleError<PaginationResponse<any>>(error, '获取打卡记录失败');
    }
  }

  async getStudentAttendanceStats(userId: number, classId?: number): Promise<ApiResponse<any>> {
    try {
      const keyBase = classId
        ? `be:attendance:stats:student:${userId}:class:${classId}`
        : `be:attendance:stats:student:${userId}`;

      if (process.env.REDIS_ENABLED === 'true') {
        const cached = await get(keyBase);
        if (cached) return JSON.parse(cached) as ApiResponse<any>;
      }

      const where: WhereOptions = { user_id: userId };

      if (classId) {
        const classInstance = await this.classModel.findByPk(classId);
        if (!classInstance) {
          return { code: 404, message: '班级不存在' };
        }

        const classTasks = await this.taskModel.findAll({
          where: { course_id: classInstance.course_id },
          attributes: ['id'],
        });
        const taskIds = classTasks.map((task: any) => task.id);

        if (taskIds.length === 0) {
          const emptyResp: ApiResponse<any> = {
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
          return emptyResp;
        }

        (where as any).task_id = { [Op.in]: taskIds };
      }

      const records = await this.recordModel.findAll({
        where,
        include: [{ model: this.userModel, attributes: ['real_name'] }],
      });

      const totalCount = records.length;
      const normalCount = records.filter((r: any) => r.status === AttendanceStatus.Normal).length;
      const lateCount = records.filter((r: any) => r.status === AttendanceStatus.Late).length;
      const absentCount = records.filter((r: any) => r.status === AttendanceStatus.Absent).length;
      const leaveCount = records.filter((r: any) => r.status === AttendanceStatus.Leave).length;
      const rate = totalCount > 0 ? (normalCount / totalCount) * 100 : 0;

      const resp: ApiResponse<any> = {
        code: 200,
        message: '获取学生考勤统计成功',
        data: {
          studentId: userId,
          studentName: records[0]?.User?.real_name ?? '',
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

  async getClassAttendanceStats(classId: number): Promise<ApiResponse<any>> {
    try {
      const cacheKey = `be:attendance:stats:class:${classId}`;
      if (process.env.REDIS_ENABLED === 'true') {
        const cached = await get(cacheKey);
        if (cached) return JSON.parse(cached) as ApiResponse<any>;
      }

      const classInstance = await this.classModel.findByPk(classId);
      if (!classInstance) {
        return { code: 404, message: '班级不存在' };
      }

      const tasks = await this.taskModel.findAll({ where: { course_id: classInstance.course_id } });
      const taskIds = tasks.map((task: any) => task.id);

      if (taskIds.length === 0) {
        const emptyResp: ApiResponse<any> = {
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
        return emptyResp;
      }

      const records = await this.recordModel.findAll({
        where: { task_id: { [Op.in]: taskIds } },
      });

      const totalCount = records.length;
      const normalCount = records.filter((r: any) => r.status === AttendanceStatus.Normal).length;
      const lateCount = records.filter((r: any) => r.status === AttendanceStatus.Late).length;
      const absentCount = records.filter((r: any) => r.status === AttendanceStatus.Absent).length;
      const leaveCount = records.filter((r: any) => r.status === AttendanceStatus.Leave).length;
      const rate = totalCount > 0 ? (normalCount / totalCount) * 100 : 0;

      const resp: ApiResponse<any> = {
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

  async getStudentAttendanceRecords(
    _userId: number,
    _pagination: PaginationParams
  ): Promise<ApiResponse<PaginationResponse<any>>> {
    return { code: 501, message: '学生考勤记录查询逻辑暂未实现' } as ApiResponse<
      PaginationResponse<any>
    >;
  }

  async batchUpdateAttendanceRecords(
    _recordIds: number[],
    _status: AttendanceStatus
  ): Promise<ApiResponse<any>> {
    return { code: 501, message: '批量更新考勤记录逻辑暂未实现' };
  }

  async updateAttendanceRecord(
    recordId: number,
    status: AttendanceStatus
  ): Promise<ApiResponse<any>> {
    try {
      const [affectedCount, affectedRows] = await this.recordModel.update(
        { status },
        { where: { id: recordId }, returning: true }
      );

      if (affectedCount === 0) {
        return { code: 404, message: '考勤记录不存在' };
      }

      const record = affectedRows[0] as any;
      if (process.env.REDIS_ENABLED === 'true') {
        const task = await this.taskModel.findByPk(record.task_id);
        const classId = task?.classId;
        const userId = record.user_id;
        if (classId) await del(`be:attendance:stats:class:${classId}`);
        if (userId && classId) {
          await del(`be:attendance:stats:student:${userId}:class:${classId}`);
        }
        if (userId) await del(`be:attendance:stats:student:${userId}`);
      }

      return { code: 200, message: '考勤记录更新成功', data: record };
    } catch (error) {
      return this.handleError(error, '考勤记录更新失败');
    }
  }

  async exportAttendanceData(_classId: number): Promise<ApiResponse<any>> {
    return { code: 501, message: '导出考勤数据逻辑暂未实现' };
  }

  private async findAllWithPagination(
    params: PaginationParams,
    where?: WhereOptions
  ): Promise<ApiResponse<PaginationResponse<any>>> {
    try {
      const { page, size } = params;
      const offset = (page - 1) * size;

      const { count, rows } = await this.taskModel.findAndCountAll({
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
      return this.handleError<PaginationResponse<any>>(error, '查询失败');
    }
  }

  private handleError<T = any>(error: unknown, message: string): ApiResponse<T> {
    this.logger.error(message, error instanceof Error ? error.stack : undefined);
    return { code: 500, message } as ApiResponse<T>;
  }
}
