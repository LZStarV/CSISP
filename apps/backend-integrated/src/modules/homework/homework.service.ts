import { Inject, Injectable, Logger } from '@nestjs/common';
import { Op, type WhereOptions } from 'sequelize';
import type {
  ApiResponse,
  CreateHomeworkInput,
  CreateHomeworkSubmissionInput,
  PaginationParams,
  PaginationResponse,
  Status,
} from '@csisp/types';
import { Status as StatusEnum } from '@csisp/types';
import { get, set, del } from '@infra/redis';
import { POSTGRES_MODELS } from '@infra/postgres/postgres.providers';

type ModelsDict = Record<string, any>;

/**
 * 作业领域服务
 *
 * 复刻旧 backend 中 HomeworkService 的核心业务逻辑，
 * 负责作业发布、提交、统计与批改等操作。
 */
@Injectable()
export class HomeworkService {
  private readonly logger = new Logger(HomeworkService.name);

  private readonly homeworkModel: any;
  private readonly submissionModel: any;
  private readonly classModel: any;
  private readonly fileModel: any;
  private readonly userModel: any;

  constructor(@Inject(POSTGRES_MODELS) models: ModelsDict) {
    this.homeworkModel = models.Homework;
    this.submissionModel = models.HomeworkSubmission;
    this.fileModel = models.HomeworkFile;
    this.classModel = models.Class;
    this.userModel = models.User;
  }

  async createHomework(input: CreateHomeworkInput): Promise<ApiResponse<any>> {
    try {
      const classInstance = await this.classModel.findByPk(input.classId);
      if (!classInstance) {
        return { code: 404, message: '班级不存在' };
      }

      const now = new Date();
      if (new Date(input.deadline) <= now) {
        return { code: 400, message: '截止时间必须晚于当前时间' };
      }

      const homework = await this.homeworkModel.create(input);

      const resp: ApiResponse<any> = {
        code: 201,
        message: '作业发布成功',
        data: homework,
      };
      if (process.env.REDIS_ENABLED === 'true') {
        await del(`be:homework:list:class:${input.classId}:page=1|size=10`);
      }
      return resp;
    } catch (error) {
      return this.handleError(error, '作业发布失败');
    }
  }

  async submitHomework(
    input: CreateHomeworkSubmissionInput,
    fileData?: { fileName: string; filePath: string; fileSize: number; fileType: string }
  ): Promise<ApiResponse<any>> {
    try {
      const { homeworkId, userId } = input;

      const homework = await this.homeworkModel.findByPk(homeworkId);
      if (!homework) {
        return { code: 404, message: '作业不存在' };
      }

      if (homework.status !== StatusEnum.Active) {
        return { code: 400, message: '作业已关闭，无法提交' };
      }

      const now = new Date();
      if (now > new Date(homework.deadline)) {
        return { code: 400, message: '作业已过期，无法提交' };
      }

      const userClass = await this.classModel.findOne({
        include: [
          {
            model: this.userModel,
            where: { id: userId },
            through: { attributes: [] },
          },
        ],
        where: { id: homework.classId },
      });

      if (!userClass) {
        return { code: 403, message: '您不属于该班级，无法提交作业' };
      }

      const existingSubmission = await this.submissionModel.findOne({
        where: { homeworkId, userId },
      });

      if (existingSubmission) {
        return { code: 409, message: '您已提交过该作业，请勿重复提交' };
      }

      const submission = await this.submissionModel.create({
        ...input,
        status: 'submitted',
      });

      if (fileData) {
        await this.fileModel.create({
          submissionId: submission.id,
          file_name: fileData.fileName,
          file_path: fileData.filePath,
          file_size: fileData.fileSize,
          file_type: fileData.fileType,
        });
      }

      const resp: ApiResponse<any> = {
        code: 201,
        message: '作业提交成功',
        data: submission,
      };
      if (process.env.REDIS_ENABLED === 'true') {
        await del(`be:homework:stats:${homeworkId}`);
        await del(`be:homework:submissions:list:${homeworkId}:page=1|size=10`);
        await del(`be:homework:submissions:student:${userId}`);
      }
      return resp;
    } catch (error) {
      return this.handleError(error, '作业提交失败');
    }
  }

  async getClassHomeworks(
    classId: number,
    pagination: PaginationParams
  ): Promise<ApiResponse<PaginationResponse<any>>> {
    try {
      const cacheKey = `be:homework:list:class:${classId}:page=${pagination.page}|size=${pagination.size}`;
      if (process.env.REDIS_ENABLED === 'true') {
        const cached = await get(cacheKey);
        if (cached) return JSON.parse(cached) as ApiResponse<PaginationResponse<any>>;
      }

      const classInstance = await this.classModel.findByPk(classId);
      if (!classInstance) {
        return { code: 404, message: '班级不存在' } as ApiResponse<PaginationResponse<any>>;
      }

      const result = await this.findAllWithPagination(pagination, {
        class_id: classId,
        status: StatusEnum.Active,
      });

      if (process.env.REDIS_ENABLED === 'true' && result.code === 200) {
        await set(cacheKey, JSON.stringify(result), 120);
      }
      return result;
    } catch (error) {
      return this.handleError<PaginationResponse<any>>(error, '获取班级作业失败');
    }
  }

  async getHomeworkSubmissions(
    homeworkId: number,
    pagination: PaginationParams
  ): Promise<ApiResponse<PaginationResponse<any>>> {
    try {
      const cacheKey = `be:homework:submissions:list:${homeworkId}:page=${pagination.page}|size=${pagination.size}`;
      if (process.env.REDIS_ENABLED === 'true') {
        const cached = await get(cacheKey);
        if (cached) return JSON.parse(cached) as ApiResponse<PaginationResponse<any>>;
      }

      const homework = await this.homeworkModel.findByPk(homeworkId);
      if (!homework) {
        return { code: 404, message: '作业不存在' } as ApiResponse<PaginationResponse<any>>;
      }

      const { page, size } = pagination;
      const offset = (page - 1) * size;

      const { count, rows } = await this.submissionModel.findAndCountAll({
        where: { homework_id: homeworkId },
        include: [
          {
            model: this.userModel,
            attributes: ['id', 'username', 'real_name', 'student_id'],
          },
          {
            model: this.fileModel,
            attributes: ['id', 'file_name', 'file_size', 'upload_time'],
          },
        ],
        limit: size,
        offset,
        order: [['submit_time', 'DESC']],
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
        message: '获取作业提交情况成功',
        data: payload,
      };

      if (process.env.REDIS_ENABLED === 'true') {
        await set(cacheKey, JSON.stringify(resp), 120);
      }
      return resp;
    } catch (error) {
      return this.handleError<PaginationResponse<any>>(error, '获取作业提交情况失败');
    }
  }

  async getHomeworkStats(homeworkId: number): Promise<ApiResponse<any>> {
    try {
      const cacheKey = `be:homework:stats:${homeworkId}`;
      if (process.env.REDIS_ENABLED === 'true') {
        const cached = await get(cacheKey);
        if (cached) return JSON.parse(cached) as ApiResponse<any>;
      }

      const homework = await this.homeworkModel.findByPk(homeworkId);
      if (!homework) {
        return { code: 404, message: '作业不存在' };
      }

      const classInfo = await this.classModel.findByPk(homework.class_id, {
        include: [{ model: this.userModel, through: { attributes: [] } }],
      });

      const totalStudents = (classInfo as any)?.Users?.length ?? 0;

      const submissions = await this.submissionModel.findAll({
        where: { homework_id: homeworkId },
      });

      const submittedCount = submissions.length;
      const gradedCount = submissions.filter((s: any) => s.status === 'graded').length;
      const overdueCount = submissions.filter(
        (s: any) => new Date(s.submit_time) > new Date(homework.deadline)
      ).length;

      const averageScore =
        gradedCount > 0
          ? submissions.reduce((sum: number, s: any) => sum + (s.score ?? 0), 0) / gradedCount
          : 0;

      const resp: ApiResponse<any> = {
        code: 200,
        message: '获取作业统计成功',
        data: {
          totalStudents,
          submittedCount,
          gradedCount,
          overdueCount,
          notSubmittedCount: totalStudents - submittedCount,
          submissionRate:
            totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) / 100 : 0,
          averageScore: Math.round(averageScore * 100) / 100,
        },
      };

      if (process.env.REDIS_ENABLED === 'true') {
        await set(cacheKey, JSON.stringify(resp), 60);
      }
      return resp;
    } catch (error) {
      return this.handleError(error, '获取作业统计失败');
    }
  }

  async updateHomeworkStatus(homeworkId: number, status: Status): Promise<ApiResponse<any>> {
    try {
      const [affectedCount, affectedRows] = await this.homeworkModel.update(
        { status },
        { where: { id: homeworkId }, returning: true }
      );

      if (affectedCount === 0) {
        return { code: 404, message: '作业不存在' };
      }

      const resp: ApiResponse<any> = {
        code: 200,
        message: '作业状态更新成功',
        data: affectedRows[0],
      };

      if (process.env.REDIS_ENABLED === 'true') {
        await del(`be:homework:stats:${homeworkId}`);
      }
      return resp;
    } catch (error) {
      return this.handleError(error, '作业状态更新失败');
    }
  }

  async updateHomework(
    homeworkId: number,
    data: Partial<CreateHomeworkInput>
  ): Promise<ApiResponse<any>> {
    try {
      const [affectedCount, affectedRows] = await this.homeworkModel.update(data, {
        where: { id: homeworkId },
        returning: true,
      });

      if (affectedCount === 0) {
        return { code: 404, message: '作业不存在' };
      }

      const resp: ApiResponse<any> = {
        code: 200,
        message: '作业信息更新成功',
        data: affectedRows[0],
      };

      if (process.env.REDIS_ENABLED === 'true') {
        await del(`be:homework:stats:${homeworkId}`);
      }
      return resp;
    } catch (error) {
      return this.handleError(error, '作业信息更新失败');
    }
  }

  async deleteHomework(homeworkId: number): Promise<ApiResponse<any>> {
    try {
      const homework = await this.homeworkModel.findByPk(homeworkId);
      if (!homework) {
        return { code: 404, message: '作业不存在' };
      }

      await this.homeworkModel.destroy({ where: { id: homeworkId } });

      if (process.env.REDIS_ENABLED === 'true') {
        await del(`be:homework:stats:${homeworkId}`);
        await del(`be:homework:list:class:${homework.classId}:page=1|size=10`);
      }

      return { code: 200, message: '作业删除成功' };
    } catch (error) {
      return this.handleError(error, '删除作业失败');
    }
  }

  async getStudentHomeworkSummary(userId: number, classId?: number): Promise<ApiResponse<any>> {
    try {
      const cacheKey = classId
        ? `be:homework:submissions:student:${userId}:class:${classId}`
        : `be:homework:submissions:student:${userId}`;
      if (process.env.REDIS_ENABLED === 'true') {
        const cached = await get(cacheKey);
        if (cached) return JSON.parse(cached) as ApiResponse<any>;
      }

      const where: WhereOptions = { user_id: userId };

      if (classId) {
        const classHomeworks = await this.homeworkModel.findAll({
          where: { class_id: classId },
          attributes: ['id'],
        });
        const homeworkIds = classHomeworks.map((hw: any) => hw.id);

        if (homeworkIds.length === 0) {
          const emptyResp: ApiResponse<any> = {
            code: 200,
            message: '获取学生作业提交成功',
            data: [],
          };
          return emptyResp;
        }

        (where as any).homework_id = { [Op.in]: homeworkIds };
      }

      const submissions = await this.submissionModel.findAll({
        where,
        include: [
          {
            model: this.homeworkModel,
            attributes: ['id', 'title', 'deadline'],
          },
          {
            model: this.fileModel,
            attributes: ['id', 'file_name', 'file_size', 'upload_time'],
          },
        ],
        order: [['submit_time', 'DESC']],
      });

      const resp: ApiResponse<any> = {
        code: 200,
        message: '获取学生作业提交成功',
        data: submissions,
      };

      if (process.env.REDIS_ENABLED === 'true') {
        await set(cacheKey, JSON.stringify(resp), 120);
      }
      return resp;
    } catch (error) {
      return this.handleError(error, '获取学生作业提交失败');
    }
  }

  async gradeHomework(
    homeworkId: number,
    userId: number,
    score: number,
    comment?: string
  ): Promise<ApiResponse<any>> {
    try {
      if (score < 0 || score > 100) {
        return { code: 400, message: '分数必须在0-100之间' };
      }

      const [affectedCount, affectedRows] = await this.submissionModel.update(
        {
          score,
          comment,
          status: 'graded',
        },
        {
          where: { homework_id: homeworkId, user_id: userId },
          returning: true,
        }
      );

      if (affectedCount === 0) {
        return { code: 404, message: '作业提交不存在' };
      }

      const resp: ApiResponse<any> = {
        code: 200,
        message: '作业批改成功',
        data: affectedRows[0],
      };

      if (process.env.REDIS_ENABLED === 'true') {
        await del(`be:homework:stats:${homeworkId}`);
      }
      return resp;
    } catch (error) {
      return this.handleError(error, '作业批改失败');
    }
  }

  async getHomeworkDetail(homeworkId: number): Promise<ApiResponse<any>> {
    try {
      const homework = await this.homeworkModel.findByPk(homeworkId);
      if (!homework) {
        return { code: 404, message: '作业不存在' };
      }
      return { code: 200, message: '获取作业详情成功', data: homework };
    } catch (error) {
      return this.handleError(error, '获取作业详情失败');
    }
  }

  async getStudentHomeworkDetail(homeworkId: number, userId: number): Promise<ApiResponse<any>> {
    try {
      const submission = await this.submissionModel.findOne({
        where: { homework_id: homeworkId, user_id: userId },
        include: [
          {
            model: this.homeworkModel,
            attributes: ['id', 'title', 'deadline'],
          },
          {
            model: this.fileModel,
            attributes: ['id', 'file_name', 'file_size', 'upload_time'],
          },
        ],
      });

      if (!submission) {
        return { code: 404, message: '作业提交不存在' };
      }

      return { code: 200, message: '获取学生作业详情成功', data: submission };
    } catch (error) {
      return this.handleError(error, '获取学生作业详情失败');
    }
  }

  private async findAllWithPagination(
    params: PaginationParams,
    where?: WhereOptions
  ): Promise<ApiResponse<PaginationResponse<any>>> {
    try {
      const { page, size } = params;
      const offset = (page - 1) * size;

      const { count, rows } = await this.homeworkModel.findAndCountAll({
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
