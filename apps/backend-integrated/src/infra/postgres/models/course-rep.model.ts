import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table
export class CourseRep extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'user_id' })
  userId!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'class_id' })
  classId!: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  responsibility!: string;

  @Column({ type: DataType.DATE, allowNull: false, field: 'appointment_date' })
  appointmentDate!: Date;

  @Column({ type: DataType.INTEGER, defaultValue: 1 })
  status!: number;
}
