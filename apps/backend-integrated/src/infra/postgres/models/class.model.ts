import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'class',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Class extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @Column({ type: DataType.STRING(255), allowNull: false, field: 'class_name' })
  className!: string;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'course_id' })
  courseId!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'teacher_id' })
  teacherId!: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  semester!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'academic_year' })
  academicYear!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 50,
    field: 'max_students',
  })
  maxStudents!: number;

  @Column({ type: DataType.INTEGER, defaultValue: 1 })
  status!: number;
}
