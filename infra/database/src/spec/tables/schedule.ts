import {
  Table,
  Model,
  Column,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';

/**
 * 课程课表安排：记录班级在某时间片的教室与地点
 */
@Table({ tableName: 'schedule', timestamps: false, underscored: true })
export class Schedule extends Model<Schedule> {
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
   * 星期（1-7）
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '星期（1-7）',
  })
  weekday!: number;

  /**
   * 时间片 ID
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '时间片 ID',
  })
  time_slot_id!: number;

  /**
   * 教室
   */
  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    comment: '教室',
  })
  room!: string;

  /**
   * 地点
   */
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: '地点',
  })
  location!: string;
}
