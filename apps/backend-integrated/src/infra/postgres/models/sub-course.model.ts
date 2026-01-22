import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table
export class SubCourse extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'course_id' })
  courseId!: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    unique: true,
    field: 'sub_course_code',
  })
  subCourseCode!: string;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'teacher_id' })
  teacherId!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'academic_year' })
  academicYear!: number;

  @Column({ type: DataType.INTEGER, defaultValue: 1 })
  status!: number;
}
