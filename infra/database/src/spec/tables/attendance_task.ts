import {
  Table,
  Model,
  Column,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';

/**
 * 考勤任务表：记录某次考勤的时间范围与课程关联
 */
@Table({ tableName: 'attendance_task', timestamps: true, underscored: true })
export class AttendanceTask extends Model<AttendanceTask> {
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
   * 开始时间
   */
  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: '开始时间',
  })
  start_time!: Date;

  /**
   * 结束时间
   */
  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: '结束时间',
  })
  end_time!: Date;

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
