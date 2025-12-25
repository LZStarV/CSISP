import { Injectable } from '@nestjs/common';
import { InjectModel as InjectMongoModel } from '@nestjs/mongoose';
import { InjectModel } from '@nestjs/sequelize';
import type { Model } from 'mongoose';
import { get, set, del } from '@infra/redis';
import type { ContentDocument } from '@infra/mongo/content.schema';
import { getBackendLogger } from '@infra/logger';
import { Class } from '@infra/postgres/models/class.model';
import { Course } from '@infra/postgres/models/course.model';

type ListQuery = {
  type?: 'announcement' | 'homework';
  courseId?: number;
  classId?: number;
  page?: number;
  size?: number;
};
type CreateBody = {
  type: 'announcement' | 'homework';
  title: string;
  richBody: string;
  attachments?: Array<{ name: string; path: string; size?: number; type?: string }>;
  authorId: number;
  scope?: { courseId?: number; classId?: number };
  status?: string;
};

@Injectable()
export class ContentService {
  constructor(
    @InjectMongoModel('Content') private readonly contentModel: Model<ContentDocument>,
    @InjectModel(Class) private readonly classModel: any,
    @InjectModel(Course) private readonly courseModel: any
  ) {}

  async list(query: ListQuery) {
    try {
      const page = Math.max(1, query.page || 1);
      const size = Math.min(100, Math.max(1, query.size || 20));
      const key = `csisp:be:content:list:type=${query.type || 'all'}|course=${query.courseId || 'all'}|class=${query.classId || 'all'}|page=${page}|size=${size}`;
      if (process.env.REDIS_ENABLED === 'true') {
        const cached = await get(key);
        if (cached) return JSON.parse(cached);
      }
      const q: any = {};
      if (query.type) q.type = query.type;
      if (query.courseId) q['scope.courseId'] = query.courseId;
      if (query.classId) q['scope.classId'] = query.classId;
      const docs = await this.contentModel
        .find(q)
        .sort({ createdAt: -1 })
        .skip((page - 1) * size)
        .limit(size)
        .exec();
      const total = await this.contentModel.countDocuments(q);
      const data = {
        data: docs.map((doc: any) => ({
          id: String(doc._id),
          type: doc.type,
          title: doc.title,
          richBody: doc.richBody,
          attachments: doc.attachments || [],
          authorId: doc.authorId,
          scope: doc.scope || {},
          status: doc.status,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        })),
        pagination: { page, size, total },
      };
      if (process.env.REDIS_ENABLED === 'true') {
        await set(key, JSON.stringify({ code: 200, message: 'ok', data }), 120);
      }
      return { code: 200, message: 'ok', data };
    } catch (e) {
      const logger = getBackendLogger('content');
      logger.error({ error: (e as any)?.message }, 'Content list failed');
      return { code: 500, message: '服务器内部错误' } as any;
    }
  }

  async get(id: string) {
    try {
      const key = `csisp:be:content:detail:${id}`;
      if (process.env.REDIS_ENABLED === 'true') {
        const cached = await get(key);
        if (cached) return JSON.parse(cached);
      }
      const doc = await this.contentModel.findById(id).exec();
      if (!doc) return { code: 404, message: 'not found' };
      const data = {
        id: String(doc._id),
        type: doc.type,
        title: doc.title,
        richBody: doc.richBody,
        attachments: doc.attachments || [],
        authorId: doc.authorId,
        scope: doc.scope || {},
        status: doc.status,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      };
      if (process.env.REDIS_ENABLED === 'true') {
        await set(key, JSON.stringify({ code: 200, message: 'ok', data }), 300);
      }
      return { code: 200, message: 'ok', data };
    } catch (e) {
      const logger = getBackendLogger('content');
      logger.error({ error: (e as any)?.message }, 'Content detail failed');
      return { code: 500, message: '服务器内部错误' } as any;
    }
  }

  async create(body: CreateBody) {
    if (body.scope?.classId) {
      const classInst = await this.classModel.findByPk(body.scope.classId);
      if (!classInst) return { code: 404, message: '班级不存在' };
    }
    if (body.scope?.courseId) {
      const courseInst = await this.courseModel.findByPk(body.scope.courseId);
      if (!courseInst) return { code: 404, message: '课程不存在' };
    }
    const created = await this.contentModel.create({
      type: body.type,
      title: body.title,
      richBody: body.richBody,
      attachments: body.attachments || [],
      authorId: body.authorId,
      scope: body.scope || {},
      status: body.status || 'published',
    });
    return { code: 201, message: 'created', data: { id: String(created._id) } };
  }

  async remove(id: string) {
    try {
      await this.contentModel.findByIdAndDelete(id).exec();
      if (process.env.REDIS_ENABLED === 'true') {
        await del(`csisp:be:content:detail:${id}`);
      }
      return { code: 200, message: 'deleted' };
    } catch (e) {
      const logger = getBackendLogger('content');
      logger.error({ error: (e as any)?.message }, 'Content remove failed');
      return { code: 500, message: '服务器内部错误' } as any;
    }
  }

  async stats() {
    try {
      const key = 'csisp:be:content:stats';
      if (process.env.REDIS_ENABLED === 'true') {
        const cached = await get(key);
        if (cached) return JSON.parse(cached);
      }
      const notificationCount = await this.contentModel.countDocuments({ type: 'announcement' });
      const resp = { code: 200, message: 'ok', data: { notificationCount } };
      if (process.env.REDIS_ENABLED === 'true') {
        await set(key, JSON.stringify(resp), 60);
      }
      return resp;
    } catch (e) {
      const logger = getBackendLogger('content');
      logger.error({ error: (e as any)?.message }, 'Content stats failed');
      return { code: 500, message: '服务器内部错误' } as any;
    }
  }

  async recent(limit = 10) {
    try {
      const safeLimit = Math.min(50, Math.max(1, Number(limit) || 10));
      const docs = await this.contentModel.find({}).sort({ createdAt: -1 }).limit(safeLimit).exec();
      const data = docs.map((doc: any) => ({
        id: String(doc._id),
        type: doc.type,
        title: doc.title,
        description: doc.richBody.slice(0, 140),
        timestamp: doc.createdAt,
      }));
      return { code: 200, message: 'ok', data };
    } catch (e) {
      const logger = getBackendLogger('content');
      logger.error({ error: (e as any)?.message }, 'Content recent failed');
      return { code: 500, message: '服务器内部错误' } as any;
    }
  }
}
