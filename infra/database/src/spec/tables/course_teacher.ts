import {
  Table,
  Model,
  Column,
  DataType,
  PrimaryKey,
} from 'sequelize-typescript';

/**
 * 课程-教师关联表：课程与任课教师的多对多关系
 */
@Table({ tableName: 'course_teacher', timestamps: true, underscored: true })
export class CourseTeacher extends Model<CourseTeacher> {
  /**
   * 课程 ID（复合主键）
   */
  @PrimaryKey
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '课程 ID（复合主键）',
  })
  course_id!: number;

  /**
   * 教师 ID（复合主键）
   */
  @PrimaryKey
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '教师 ID（复合主键）',
  })
  teacher_id!: number;

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
