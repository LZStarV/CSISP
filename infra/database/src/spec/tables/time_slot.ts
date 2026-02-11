import {
  Table,
  Model,
  Column,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';

/**
 * 上课时间片表：记录课程的周次与时间段安排
 */
@Table({ tableName: 'time_slot', timestamps: true, underscored: true })
export class TimeSlot extends Model<TimeSlot> {
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
   * 星期（1-7）
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '星期（1-7）',
  })
  week_day!: number;

  /**
   * 开始时间（字符 HH:mm）
   */
  @Column({
    type: DataType.STRING(10),
    allowNull: false,
    comment: '开始时间（HH:mm）',
  })
  start_time!: string;

  /**
   * 结束时间（字符 HH:mm）
   */
  @Column({
    type: DataType.STRING(10),
    allowNull: false,
    comment: '结束时间（HH:mm）',
  })
  end_time!: string;

  /**
   * 上课地点（可空）
   */
  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    comment: '上课地点（可空）',
  })
  location?: string | null;

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
