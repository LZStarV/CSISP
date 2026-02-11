import {
  Table,
  Model,
  Column,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';

/**
 * 考勤记录表：记录用户在某次考勤任务中的打卡状态与设备信息
 */
@Table({ tableName: 'attendance_record', timestamps: true, underscored: true })
export class AttendanceRecord extends Model<AttendanceRecord> {
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
   * 考勤任务 ID
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '考勤任务 ID',
  })
  task_id!: number;

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
   * 打卡时间
   */
  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: '打卡时间',
  })
  checkin_time!: Date;

  /**
   * 状态（默认 present）
   */
  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    defaultValue: 'present',
    comment: '状态（默认 present）',
  })
  status!: string;

  /**
   * IP 地址（可空）
   */
  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    comment: 'IP 地址（可空）',
  })
  ip_address?: string | null;

  /**
   * 设备信息（可空）
   */
  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '设备信息（可空）',
  })
  device_info?: string | null;

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
