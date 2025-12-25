import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'attendance_record',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class AttendanceRecord extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'task_id' })
  attendanceTaskId!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'user_id' })
  userId!: number;

  @Column({ type: DataType.DATE, allowNull: false, field: 'checkin_time' })
  checkinTime!: Date;

  @Column({ type: DataType.STRING(50), allowNull: false, defaultValue: 'present' })
  status!: string;

  @Column({ type: DataType.STRING(50), allowNull: true, field: 'ip_address' })
  ipAddress!: string | null;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'device_info' })
  deviceInfo!: string | null;
}
