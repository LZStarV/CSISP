import { Schema, type Document } from 'mongoose';

// 文档类型定义：用于约束 Model<ContentDocument> 的字段与返回类型。
export interface ContentDocument extends Document {
  type: 'announcement' | 'homework';
  title: string;
  richBody: string;
  attachments: Array<{
    name: string;
    path: string;
    size?: number;
    type?: string;
  }>;
  authorId: number; // 作者（发布者）ID：引用 PostgreSQL 的 user.id
  scope: { courseId?: number; classId?: number }; // 归属范围：课程/班级（用于筛选与权限校验）
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// Schema 定义：字段约束、默认值与集合名称。
export const ContentSchema = new Schema<ContentDocument>(
  {
    type: { type: String, required: true, enum: ['announcement', 'homework'] }, // 文档类型
    title: { type: String, required: true }, // 标题
    richBody: { type: String, required: true }, // 富文本正文（HTML/Markdown 渲染字符串）
    attachments: {
      type: [
        {
          name: { type: String, required: true }, // 附件名称
          path: { type: String, required: true }, // 文件路径（或对象存储Key）
          size: { type: Number, required: false }, // 文件大小（字节）
          type: { type: String, required: false }, // MIME 类型（可选）
        },
      ],
      default: [],
    },
    authorId: { type: Number, required: true }, // 作者ID（PostgreSQL 引用）
    scope: {
      courseId: { type: Number, required: false }, // 归属课程ID（PostgreSQL 引用）
      classId: { type: Number, required: false }, // 归属班级ID（PostgreSQL 引用）
    },
    status: { type: String, required: true, default: 'published' }, // 状态：published/archived 等（保留扩展）
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    collection: 'content',
  }
);

// 索引：提升常用列表与筛选性能
ContentSchema.index({ type: 1, createdAt: -1 }); // 按类型 + 时间倒序分页
ContentSchema.index({ 'scope.courseId': 1, createdAt: -1 }); // 课程维度 + 时间倒序
ContentSchema.index({ 'scope.classId': 1, createdAt: -1 }); // 班级维度 + 时间倒序
