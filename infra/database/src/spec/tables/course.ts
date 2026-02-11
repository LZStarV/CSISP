import {
  Table,
  Model,
  Column,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';

/**
 * 课程表：记录课程基础信息与开设学期/学年
 */
@Table({ tableName: 'course', timestamps: true, underscored: true })
export class Course extends Model<Course> {
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
   * 课程名称
   */
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: '课程名称',
  })
  course_name!: string;

  /**
   * 课程代码
   */
  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '课程代码',
  })
  course_code!: string;

  /**
   * 开设学期
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '开设学期',
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
   * 可选专业列表（JSON，可空）
   */
  @Column({
    type: DataType.JSON,
    allowNull: true,
    comment: '可选专业列表（JSON，可空）',
  })
  available_majors?: unknown;

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
