import {
  Table,
  Model,
  Column,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';

/**
 * 班级表：记录课程的具体班级与任课教师、学期等信息
 */
@Table({ tableName: 'class', timestamps: true, underscored: true })
export class ClassModel extends Model<ClassModel> {
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
   * 班级名称
   */
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: '班级名称',
  })
  class_name!: string;

  /**
   * 课程 ID
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '课程 ID',
  })
  course_id!: number;

  /**
   * 任课教师 ID
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '任课教师 ID',
  })
  teacher_id!: number;

  /**
   * 学期
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '学期',
  })
  semester!: number;

  /**
   * 学年
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '学年',
  })
  academic_year!: number;

  /**
   * 最大选课人数
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 50,
    comment: '最大选课人数',
  })
  max_students!: number;

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
