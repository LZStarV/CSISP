import { prop, modelOptions } from '@typegoose/typegoose';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';

/**
 * Reply 文档模型
 * 帖子回复
 */
@modelOptions({
  schemaOptions: {
    collection: 'replies',
    timestamps: true,
  },
})
export class Reply {
  /**
   * 关联帖子 ID
   */
  @prop({ required: true, type: String, index: true })
  public postId!: string;

  /**
   * 回复内容
   */
  @prop({ required: true, type: String })
  public content!: string;

  /**
   * 回复者 ID
   */
  @prop({ required: true, type: String })
  public authorId!: string;

  /**
   * 回复者名称
   */
  @prop({ required: true, type: String })
  public authorName!: string;

  /**
   * 获取文档类型
   */
  public static getDocumentType(): typeof Reply {
    return Reply;
  }
}

/**
 * Reply 文档类型
 */
export type ReplyDocument = DocumentType<Reply>;

/**
 * Reply 模型类型
 */
export type ReplyModel = ReturnModelType<typeof Reply>;

/**
 * Reply 插入类型
 */
export type ReplyInsert = Omit<Reply, keyof ReplyDocument>;

/**
 * Reply 更新类型
 */
export type ReplyUpdate = Partial<ReplyInsert>;
