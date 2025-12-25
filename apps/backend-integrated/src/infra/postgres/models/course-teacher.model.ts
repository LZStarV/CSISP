import { Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Course } from './course.model';
import { Teacher } from './teacher.model';

@Table({
  tableName: 'course_teacher',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class CourseTeacher extends Model {
  @ForeignKey(() => Course)
  @Column({ type: DataType.INTEGER, allowNull: false, primaryKey: true, field: 'course_id' })
  courseId!: number;

  @ForeignKey(() => Teacher)
  @Column({ type: DataType.INTEGER, allowNull: false, primaryKey: true, field: 'teacher_id' })
  teacherId!: number;
}
