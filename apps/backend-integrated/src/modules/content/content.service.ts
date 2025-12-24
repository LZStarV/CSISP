import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { POSTGRES_MODELS } from '@infra/postgres/postgres.providers';
import { get, set, del } from '@infra/redis';
import type { ContentDocument } from '@infra/mongo/content.schema';

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
    @InjectModel('Content') private readonly contentModel: Model<ContentDocument>,
    @Inject(POSTGRES_MODELS) private readonly models: Record<string, any>
  ) {}

  async list(query: ListQuery) {
    const page = Math.max(1, query.page || 1);
    const size = Math.min(100, Math.max(1, query.size || 20));
    const key = `csisp:be:content:list:type=${query.type || 'all'}|course=${query.courseId || 'all'}|class=${query.classId || 'all'}|page=${page}|size=${size}`;
    const cached = await get(key);
    if (cached) return JSON.parse(cached);
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
    await set(key, JSON.stringify({ code: 200, message: 'ok', data }), 120);
    return { code: 200, message: 'ok', data };
  }

  async get(id: string) {
    const key = `csisp:be:content:detail:${id}`;
    const cached = await get(key);
    if (cached) return JSON.parse(cached);
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
    await set(key, JSON.stringify({ code: 200, message: 'ok', data }), 300);
    return { code: 200, message: 'ok', data };
  }

  async create(body: CreateBody) {
    if (body.scope?.classId) {
      const classInst = await this.models.Class.findByPk(body.scope.classId);
      if (!classInst) return { code: 404, message: '班级不存在' };
    }
    if (body.scope?.courseId) {
      const courseInst = await this.models.Course.findByPk(body.scope.courseId);
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
    await this.contentModel.findByIdAndDelete(id).exec();
    await del(`csisp:be:content:detail:${id}`);
    return { code: 200, message: 'deleted' };
  }
}
