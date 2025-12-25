import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'time_slot',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class TimeSlot extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'course_id' })
  courseId!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'week_day' })
  weekDay!: number;

  @Column({ type: DataType.STRING(10), allowNull: false, field: 'start_time' })
  startTime!: string;

  @Column({ type: DataType.STRING(10), allowNull: false, field: 'end_time' })
  endTime!: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  location!: string;

  @Column({ type: DataType.INTEGER, defaultValue: 1 })
  status!: number;
}
