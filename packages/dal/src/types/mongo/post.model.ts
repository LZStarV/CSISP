import { prop, modelOptions } from '@typegoose/typegoose';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';

/**
 * Post 文档模型
 * 论坛帖子
 */
@modelOptions({
  schemaOptions: {
    collection: 'posts',
    timestamps: true,
  },
})
export class Post {
  /**
   * 帖子标题
   */
  @prop({ required: true, type: String })
  public title!: string;

  /**
   * 帖子内容
   */
  @prop({ required: true, type: String })
  public content!: string;

  /**
   * 作者 ID
   */
  @prop({ required: true, type: String })
  public authorId!: string;

  /**
   * 作者名称
   */
  @prop({ required: true, type: String })
  public authorName!: string;

  /**
   * 帖子类型
   */
  @prop({ type: String, default: 'default' })
  public postType?: string;

  /**
   * 获取文档类型
   */
  public static getDocumentType(): typeof Post {
    return Post;
  }
}

/**
 * Post 文档类型
 */
export type PostDocument = DocumentType<Post>;

/**
 * Post 模型类型
 */
export type PostModel = ReturnModelType<typeof Post>;

/**
 * Post 插入类型
 */
export type PostInsert = Omit<Post, keyof PostDocument>;

/**
 * Post 更新类型
 */
export type PostUpdate = Partial<PostInsert>;
