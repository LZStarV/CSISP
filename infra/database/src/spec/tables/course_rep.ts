import {
  Table,
  Model,
  Column,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';

/**
 * 课代表表：记录班级的课代表与职责说明
 */
@Table({ tableName: 'course_rep', timestamps: false, underscored: true })
export class CourseRep extends Model<CourseRep> {
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
   * 职责说明
   */
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: '职责说明',
  })
  responsibility!: string;

  /**
   * 任命日期
   */
  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: '任命日期',
  })
  appointment_date!: Date;

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
}
