import { Column, DataType, Model, Table } from 'sequelize-typescript';
import type CourseRepRow from '../generated/public/CourseRep';
import type { CourseRepInitializer } from '../generated/public/CourseRep';

@Table({ tableName: 'course_rep', timestamps: false, underscored: true })
export class CourseRep extends Model<CourseRepRow, CourseRepInitializer> {
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
