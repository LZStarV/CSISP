import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'course',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Course extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @Column({ type: DataType.STRING(255), allowNull: false, field: 'course_name' })
  courseName!: string;

  @Column({ type: DataType.STRING(50), allowNull: false, unique: true, field: 'course_code' })
  courseCode!: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  semester!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'academic_year' })
  academicYear!: number;

  @Column({ type: DataType.JSON, allowNull: true, field: 'available_majors' })
  availableMajors!: unknown;

  @Column({ type: DataType.INTEGER, defaultValue: 1 })
  status!: number;
}
