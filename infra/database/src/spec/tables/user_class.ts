import {
  Table,
  Model,
  Column,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';

/**
 * 用户选课班级表：记录用户加入班级的关系与状态
 */
@Table({ tableName: 'user_class', timestamps: true, underscored: true })
export class UserClass extends Model<UserClass> {
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
   * 用户 ID
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '用户 ID',
  })
  user_id!: number;

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
   * 加入时间
   */
  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    comment: '加入时间',
  })
  join_time!: Date;

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
