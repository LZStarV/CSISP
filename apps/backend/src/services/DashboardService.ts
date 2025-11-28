import { ApiResponse } from '@csisp/types';
import { Op, fn, col, literal } from 'sequelize';

export class DashboardService {
  private userModel: any;
  private courseModel: any;
  private classModel: any;
  private attendanceRecordModel: any;
  private homeworkModel: any;
  private homeworkSubmissionModel: any;
  private notificationModel: any;

  constructor(models: Record<string, any>) {
    this.userModel = models.User;
    this.courseModel = models.Course;
    this.classModel = models.Class;
    this.attendanceRecordModel = models.AttendanceRecord;
    this.homeworkModel = models.Homework;
    this.homeworkSubmissionModel = models.HomeworkSubmission;
    this.notificationModel = models.Notification;
  }

  async getStats(): Promise<ApiResponse<any>> {
    try {
      const safeCount = async (model: any, where?: any) => {
        try {
          return await model.count(where ? { where } : {});
        } catch {
          return 0;
        }
      };

      const [
        userCount,
        courseCount,
        classCount,
        attendanceTotal,
        attendanceNormal,
        homeworkTotal,
        submissionTotal,
        notificationCount,
      ] = await Promise.all([
        safeCount(this.userModel),
        safeCount(this.courseModel),
        safeCount(this.classModel),
        safeCount(this.attendanceRecordModel),
        safeCount(this.attendanceRecordModel, { status: 'normal' }),
        safeCount(this.homeworkModel),
        safeCount(this.homeworkSubmissionModel),
        safeCount(this.notificationModel),
      ]);

      const attendanceRate =
        attendanceTotal > 0 ? Math.round((attendanceNormal / attendanceTotal) * 100) : 0;
      const homeworkSubmissionRate =
        homeworkTotal > 0 ? Math.round((submissionTotal / homeworkTotal) * 100) : 0;

      return {
        code: 200,
        message: 'OK',
        data: {
          userCount,
          courseCount,
          classCount,
          attendanceRate,
          homeworkSubmissionRate,
          notificationCount,
        },
      };
    } catch (error: any) {
      return { code: 500, message: error?.message || '统计数据获取失败' };
    }
  }

  async getUserGrowth(days = 30): Promise<ApiResponse<Array<{ date: string; count: number }>>> {
    try {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - days + 1);

      const rows = await this.userModel.findAll({
        attributes: [
          [fn('TO_CHAR', col('created_at'), 'YYYY-MM-DD'), 'date'],
          [fn('COUNT', literal('*')), 'count'],
        ],
        where: {
          created_at: {
            [Op.between]: [start, end],
          },
        },
        group: ['date'],
        order: [[literal('date'), 'ASC']],
        raw: true,
      });

      // 补齐日期
      const map: Record<string, number> = {};
      rows.forEach((r: any) => (map[r.date] = parseInt(r.count)));
      const result: Array<{ date: string; count: number }> = [];
      const cursor = new Date(start);
      while (cursor <= end) {
        const key = cursor.toISOString().slice(0, 10);
        result.push({ date: key, count: map[key] || 0 });
        cursor.setDate(cursor.getDate() + 1);
      }

      return { code: 200, message: 'OK', data: result };
    } catch (error: any) {
      return { code: 500, message: error?.message || '用户增长数据获取失败' };
    }
  }

  async getCourseDistribution(): Promise<ApiResponse<Array<{ name: string; value: number }>>> {
    try {
      const rows = await this.courseModel.findAll({
        attributes: [
          ['semester', 'name'],
          [this.courseModel.sequelize!.fn('COUNT', '*'), 'value'],
        ],
        group: ['semester'],
        order: [['semester', 'ASC']],
        raw: true,
      });

      // 格式化名称
      const data = rows.map((r: any) => ({ name: `第${r.name}学期`, value: parseInt(r.value) }));
      return { code: 200, message: 'OK', data };
    } catch (error: any) {
      return { code: 500, message: error?.message || '课程分布数据获取失败' };
    }
  }

  async getRecentActivities(limit = 10): Promise<ApiResponse<any[]>> {
    try {
      const safeFindAll = async (fnExec: () => Promise<any[]>) => {
        try {
          return await fnExec();
        } catch {
          return [] as any[];
        }
      };

      const [attendance, submissions, notifications, courses] = await Promise.all([
        safeFindAll(() =>
          this.attendanceRecordModel.findAll({
            limit,
            order: [['created_at', 'DESC']],
            include: [{ model: this.userModel, attributes: ['id', 'real_name'] }],
            raw: true,
          })
        ),
        safeFindAll(() =>
          this.homeworkSubmissionModel.findAll({
            limit,
            order: [['created_at', 'DESC']],
            include: [{ model: this.userModel, attributes: ['id', 'real_name'] }],
            raw: true,
          })
        ),
        safeFindAll(() =>
          this.notificationModel.findAll({ limit, order: [['created_at', 'DESC']], raw: true })
        ),
        safeFindAll(() =>
          this.courseModel.findAll({ limit, order: [['created_at', 'DESC']], raw: true })
        ),
      ]);

      const list: any[] = [];

      attendance.forEach((a: any) =>
        list.push({
          id: a.id,
          type: 'attendance',
          title: '学生打卡',
          description: `状态：${a.status}${a.remark ? `（${a.remark}）` : ''}`,
          timestamp: a.created_at,
          user: { id: a.user_id, realName: a['User.real_name'] },
        })
      );

      submissions.forEach((s: any) =>
        list.push({
          id: s.id,
          type: 'homework',
          title: '作业提交',
          description: s.content?.slice(0, 50) || '提交内容',
          timestamp: s.created_at,
          user: { id: s.user_id, realName: s['User.real_name'] },
        })
      );

      notifications.forEach((n: any) =>
        list.push({
          id: n.id,
          type: 'notification',
          title: n.title || '通知',
          description: n.content?.slice(0, 80) || '通知内容',
          timestamp: n.created_at,
          user: { id: n.sender_id, realName: '' },
        })
      );

      courses.forEach((c: any) =>
        list.push({
          id: c.id,
          type: 'course',
          title: '课程更新',
          description: `${c.course_name || ''} · 学期 ${c.semester}`,
          timestamp: c.created_at,
          user: { id: c.teacher_id, realName: '' },
        })
      );

      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return { code: 200, message: 'OK', data: list.slice(0, limit) };
    } catch (error: any) {
      return { code: 500, message: error?.message || '最近活动获取失败' };
    }
  }
}
