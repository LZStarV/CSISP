import { prop, modelOptions } from '@typegoose/typegoose';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';

/**
 * Demo 文档模型
 * 使用 Typegoose 装饰器定义 MongoDB Schema
 */
@modelOptions({
  schemaOptions: {
    collection: 'demo',
    timestamps: true,
  },
})
export class Demo {
  /**
   * Demo 字段 - 主要内容
   */
  @prop({ required: true, type: String })
  public demo!: string;

  /**
   * 获取文档类型
   */
  public static getDocumentType(): typeof Demo {
    return Demo;
  }
}

/**
 * Demo 文档类型（运行时文档实例类型）
 */
export type DemoDocument = DocumentType<Demo>;

/**
 * Demo 模型类型
 */
export type DemoModel = ReturnModelType<typeof Demo>;

/**
 * Demo 插入类型（创建新文档时使用）
 */
export type DemoInsert = Omit<Demo, keyof DemoDocument>;

/**
 * Demo 更新类型（更新文档时使用）
 */
export type DemoUpdate = Partial<DemoInsert>;
