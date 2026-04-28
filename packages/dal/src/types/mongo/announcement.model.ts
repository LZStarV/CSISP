import { prop, modelOptions } from '@typegoose/typegoose';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';

/**
 * Announcement 文档模型
 * 公告
 */
@modelOptions({
  schemaOptions: {
    collection: 'announcements',
    timestamps: true,
  },
})
export class Announcement {
  /**
   * 公告标题
   */
  @prop({ required: true, type: String })
  public title!: string;

  /**
   * 公告内容
   */
  @prop({ required: true, type: String })
  public content!: string;

  /**
   * 发布者 ID
   */
  @prop({ required: true, type: String })
  public authorId!: string;

  /**
   * 发布者名称
   */
  @prop({ required: true, type: String })
  public authorName!: string;

  /**
   * 公告类型
   */
  @prop({ type: String, default: 'default' })
  public postType?: string;

  /**
   * 是否已发布
   */
  @prop({ type: Boolean, default: true })
  public isPublished?: boolean;

  /**
   * 获取文档类型
   */
  public static getDocumentType(): typeof Announcement {
    return Announcement;
  }
}

/**
 * Announcement 文档类型
 */
export type AnnouncementDocument = DocumentType<Announcement>;

/**
 * Announcement 模型类型
 */
export type AnnouncementModel = ReturnModelType<typeof Announcement>;

/**
 * Announcement 插入类型
 */
export type AnnouncementInsert = Omit<Announcement, keyof AnnouncementDocument>;

/**
 * Announcement 更新类型
 */
export type AnnouncementUpdate = Partial<AnnouncementInsert>;
