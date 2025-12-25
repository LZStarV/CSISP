import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'attendance_task',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class AttendanceTask extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'course_id' })
  courseId!: number;

  @Column({ type: DataType.DATE, allowNull: false, field: 'start_time' })
  startTime!: Date;

  @Column({ type: DataType.DATE, allowNull: false, field: 'end_time' })
  endTime!: Date;

  @Column({ type: DataType.INTEGER, defaultValue: 1 })
  status!: number;
}
