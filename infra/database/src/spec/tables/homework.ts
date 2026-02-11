import {
  Table,
  Model,
  Column,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';

/**
 * 作业表：记录班级布置的作业内容与截止时间
 */
@Table({ tableName: 'homework', timestamps: true, underscored: true })
export class Homework extends Model<Homework> {
  /**
   * 主键 ID
   */
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '主键 ID',
  })
  id!: number;

  /**
   * 班级 ID
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '班级 ID',
  })
  class_id!: number;

  /**
   * 作业标题
   */
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: '作业标题',
  })
  title!: string;

  /**
   * 作业内容
   */
  @Column({
    type: DataType.TEXT,
    allowNull: false,
    comment: '作业内容',
  })
  content!: string;

  /**
   * 截止时间
   */
  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: '截止时间',
  })
  deadline!: Date;

  /**
   * 状态（1 正常）
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '状态（1 正常）',
  })
  status!: number;

  /**
   * 创建时间
   */
  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    comment: '创建时间',
  })
  created_at!: Date;

  /**
   * 更新时间
   */
  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    comment: '更新时间',
  })
  updated_at!: Date;
}
