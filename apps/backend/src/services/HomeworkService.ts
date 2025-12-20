/**
 * 作业服务类
 * 处理作业相关的业务逻辑，包括作业发布、提交、评分等
 */
import { Op, WhereOptions } from 'sequelize';
import {
  CreateHomeworkInput,
  CreateHomeworkSubmissionInput,
  ApiResponse,
  PaginationParams,
  PaginationResponse,
  Status,
} from '@csisp/types';
import { BaseService } from './BaseService';
import { get, set, del } from '@csisp/redis';

export class HomeworkService extends BaseService {
  private homeworkSubmissionModel: any;
  private homeworkFileModel: any;
  private classModel: any;
  private userModel: any;

  constructor(
    homeworkModel: any,
    homeworkSubmissionModel: any,
    homeworkFileModel: any,
    classModel: any,
    userModel: any
  ) {
    super(homeworkModel);
    this.homeworkSubmissionModel = homeworkSubmissionModel;
    this.homeworkFileModel = homeworkFileModel;
    this.classModel = classModel;
    this.userModel = userModel;
  }

  /**
   * 发布作业
   * @param homeworkData 作业数据
   * @returns 创建结果
   */
  async createHomework(homeworkData: CreateHomeworkInput): Promise<ApiResponse<any>> {
    try {
      // 检查班级是否存在
      const classInstance = await this.classModel.findByPk(homeworkData.classId);
      if (!classInstance) {
        return {
          code: 404,
          message: '班级不存在',
        };
      }

      // 检查截止时间是否有效
      const now = new Date();
      if (new Date(homeworkData.deadline) <= now) {
        return {
          code: 400,
          message: '截止时间必须晚于当前时间',
        };
      }

      const homework = await this.model.create(homeworkData);

      const resp = {
        code: 201,
        message: '作业发布成功',
        data: homework,
      };
      if (process.env.REDIS_ENABLED === 'true') {
        await del(`be:homework:list:class:${homeworkData.classId}:page=1|size=10`);
      }
      return resp;
    } catch (error) {
      return this.handleError(error, '作业发布失败');
    }
  }

  /**
   * 提交作业
   * @param submissionData 提交数据
   * @param fileData 文件数据（可选）
   * @returns 提交结果
   */
  async submitHomework(
    submissionData: CreateHomeworkSubmissionInput,
    fileData?: { fileName: string; filePath: string; fileSize: number; fileType: string }
  ): Promise<ApiResponse<any>> {
    try {
      const { homeworkId, userId } = submissionData;

      // 检查作业是否存在
      const homework = await this.model.findByPk(homeworkId);
      if (!homework) {
        return {
          code: 404,
          message: '作业不存在',
        };
      }

      // 检查作业状态
      if (homework.status !== Status.Active) {
        return {
          code: 400,
          message: '作业已关闭，无法提交',
        };
      }

      // 检查是否已过期
      const now = new Date();
      if (now > new Date(homework.deadline)) {
        return {
          code: 400,
          message: '作业已过期，无法提交',
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
        where: { id: homework.classId },
      });

      if (!userClass) {
        return {
          code: 403,
          message: '您不属于该班级，无法提交作业',
        };
      }

      // 检查是否已提交过
      const existingSubmission = await this.homeworkSubmissionModel.findOne({
        where: {
          homeworkId,
          userId,
        },
      });

      if (existingSubmission) {
        return {
          code: 409,
          message: '您已提交过该作业，请勿重复提交',
        };
      }

      // 创建提交记录
      const submission = await this.homeworkSubmissionModel.create({
        ...submissionData,
        status: 'submitted',
      });

      // 如果有文件，创建文件记录
      if (fileData) {
        await this.homeworkFileModel.create({
          submissionId: submission.id,
          ...fileData,
        });
      }

      const resp = {
        code: 201,
        message: '作业提交成功',
        data: submission,
      };
      if (process.env.REDIS_ENABLED === 'true') {
        await del(`be:homework:stats:${submissionData.homeworkId}`);
        await del(`be:homework:submissions:list:${submissionData.homeworkId}:page=1|size=10`);
        await del(`be:homework:submissions:student:${submissionData.userId}`);
      }
      return resp;
    } catch (error) {
      return this.handleError(error, '作业提交失败');
    }
  }

  /**
   * 获取班级的作业列表
   * @param classId 班级ID
   * @param params 分页参数
   * @returns 作业列表
   */
  async getClassHomeworks(
    classId: number,
    params: PaginationParams
  ): Promise<ApiResponse<PaginationResponse<any>>> {
    try {
      const cacheKey = `be:homework:list:class:${classId}:page=${params.page}|size=${params.size}`;
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
        class_id: classId, // 注意字段映射
        status: Status.Active,
      });
      if (process.env.REDIS_ENABLED === 'true' && result.code === 200) {
        await set(cacheKey, JSON.stringify(result), 120);
      }
      return result;
    } catch (error) {
      return this.handleError<PaginationResponse<any>>(error, '获取班级作业失败');
    }
  }

  /**
   * 获取学生的作业提交情况
   * @param userId 用户ID
   * @param classId 班级ID（可选）
   * @returns 作业提交情况
   */
  async getStudentSubmissions(userId: number, classId?: number): Promise<ApiResponse<any[]>> {
    try {
      const cacheKey = classId
        ? `be:homework:submissions:student:${userId}:class:${classId}`
        : `be:homework:submissions:student:${userId}`;
      if (process.env.REDIS_ENABLED === 'true') {
        const cached = await get(cacheKey);
        if (cached) return JSON.parse(cached) as ApiResponse<any[]>;
      }
      const where: WhereOptions = { user_id: userId }; // 注意字段映射

      if (classId) {
        // 获取指定班级的作业
        const classHomeworks = await this.model.findAll({
          where: { class_id: classId }, // 注意字段映射
          attributes: ['id'],
        });
        const homeworkIds = classHomeworks.map((hw: any) => hw.id);

        if (homeworkIds.length === 0) {
          return {
            code: 200,
            message: '获取学生作业提交成功',
            data: [],
          };
        }

        where.homework_id = { [Op.in]: homeworkIds }; // 注意字段映射
      }

      const submissions = await this.homeworkSubmissionModel.findAll({
        where,
        include: [
          {
            model: this.model,
            attributes: ['id', 'title', 'deadline'],
          },
          {
            model: this.homeworkFileModel,
            attributes: ['id', 'file_name', 'file_size', 'upload_time'], // 注意字段映射
          },
        ],
        order: [['submit_time', 'DESC']], // 注意字段映射
      });

      const resp = {
        code: 200,
        message: '获取学生作业提交成功',
        data: submissions,
      };
      if (process.env.REDIS_ENABLED === 'true') {
        await set(cacheKey, JSON.stringify(resp), 120);
      }
      return resp;
    } catch (error) {
      return this.handleError<any[]>(error, '获取学生作业提交失败');
    }
  }

  /**
   * 批改作业
   * @param submissionId 提交ID
   * @param score 分数
   * @param comment 评语
   * @returns 批改结果
   */
  async gradeHomework(
    submissionId: number,
    score: number,
    comment?: string
  ): Promise<ApiResponse<any>> {
    try {
      // 检查分数范围
      if (score < 0 || score > 100) {
        return {
          code: 400,
          message: '分数必须在0-100之间',
        };
      }

      // 更新提交记录
      const [affectedCount, affectedRows] = await this.homeworkSubmissionModel.update(
        {
          score,
          comment,
          status: 'graded',
        },
        {
          where: { id: submissionId },
          returning: true,
        }
      );

      if (affectedCount === 0) {
        return {
          code: 404,
          message: '作业提交不存在',
        };
      }

      const resp = {
        code: 200,
        message: '作业批改成功',
        data: affectedRows[0],
      };
      if (process.env.REDIS_ENABLED === 'true') {
        const sub: any = resp.data;
        await del(`be:homework:stats:${sub.homework_id}`);
      }
      return resp;
    } catch (error) {
      return this.handleError(error, '作业批改失败');
    }
  }

  /**
   * 获取作业的提交情况
   * @param homeworkId 作业ID
   * @param params 分页参数
   * @returns 提交情况列表
   */
  async getHomeworkSubmissions(
    homeworkId: number,
    params: PaginationParams
  ): Promise<ApiResponse<PaginationResponse<any>>> {
    try {
      const cacheKey = `be:homework:submissions:list:${homeworkId}:page=${params.page}|size=${params.size}`;
      if (process.env.REDIS_ENABLED === 'true') {
        const cached = await get(cacheKey);
        if (cached) return JSON.parse(cached) as ApiResponse<PaginationResponse<any>>;
      }
      // 检查作业是否存在
      const homework = await this.model.findByPk(homeworkId);
      if (!homework) {
        return {
          code: 404,
          message: '作业不存在',
        };
      }

      const { page, size } = params;
      const offset = (page - 1) * size;

      const { count, rows } = await this.homeworkSubmissionModel.findAndCountAll({
        where: { homework_id: homeworkId }, // 注意字段映射
        include: [
          {
            model: this.userModel,
            attributes: ['id', 'username', 'real_name', 'student_id'], // 注意字段映射
          },
          {
            model: this.homeworkFileModel,
            attributes: ['id', 'file_name', 'file_size', 'upload_time'], // 注意字段映射
          },
        ],
        limit: size,
        offset,
        order: [['submit_time', 'DESC']], // 注意字段映射
      });

      const totalPages = Math.ceil(count / size);

      const resp = {
        code: 200,
        message: '获取作业提交情况成功',
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
      return this.handleError<PaginationResponse<any>>(error, '获取作业提交情况失败');
    }
  }

  /**
   * 获取作业统计信息
   * @param homeworkId 作业ID
   * @returns 统计信息
   */
  async getHomeworkStats(homeworkId: number): Promise<ApiResponse<any>> {
    try {
      const cacheKey = `be:homework:stats:${homeworkId}`;
      if (process.env.REDIS_ENABLED === 'true') {
        const cached = await get(cacheKey);
        if (cached) return JSON.parse(cached) as ApiResponse<any>;
      }
      // 检查作业是否存在
      const homework = await this.model.findByPk(homeworkId);
      if (!homework) {
        return {
          code: 404,
          message: '作业不存在',
        };
      }

      // 获取班级总人数
      const classInfo = await this.classModel.findByPk(homework.class_id, {
        // 注意字段映射
        include: [
          {
            model: this.userModel,
            through: { attributes: [] },
          },
        ],
      });

      const totalStudents = (classInfo as any)?.Users?.length || 0;

      // 获取提交统计
      const submissions = await this.homeworkSubmissionModel.findAll({
        where: { homework_id: homeworkId }, // 注意字段映射
      });

      const submittedCount = submissions.length;
      const gradedCount = submissions.filter((s: any) => s.status === 'graded').length;
      const overdueCount = submissions.filter(
        (s: any) => new Date(s.submit_time) > new Date(homework.deadline) // 注意字段映射
      ).length;

      const averageScore =
        gradedCount > 0
          ? submissions.reduce((sum: number, s: any) => sum + (s.score || 0), 0) / gradedCount
          : 0;

      const resp = {
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

  /**
   * 更新作业状态
   * @param homeworkId 作业ID
   * @param status 状态
   * @returns 更新结果
   */
  async updateHomeworkStatus(homeworkId: number, status: Status): Promise<ApiResponse<any>> {
    try {
      const result = await this.update(homeworkId, { status });

      if (result.code === 404) {
        return result;
      }

      const resp = {
        code: 200,
        message: '作业状态更新成功',
        data: result.data!,
      };
      if (process.env.REDIS_ENABLED === 'true') {
        await del(`be:homework:stats:${homeworkId}`);
      }
      return resp;
    } catch (error) {
      return this.handleError(error, '作业状态更新失败');
    }
  }
}
