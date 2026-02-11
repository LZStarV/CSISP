import {
  Table,
  Model,
  Column,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';

/**
 * 分课程表：记录课程的分支/子课程信息与任课教师
 */
@Table({ tableName: 'sub_course', timestamps: false, underscored: true })
export class SubCourse extends Model<SubCourse> {
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
   * 课程 ID
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '课程 ID',
  })
  course_id!: number;

  /**
   * 子课程代号（唯一）
   */
  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '子课程代号（唯一）',
  })
  sub_course_code!: string;

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
   * 学年
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '学年',
  })
  academic_year!: number;

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
