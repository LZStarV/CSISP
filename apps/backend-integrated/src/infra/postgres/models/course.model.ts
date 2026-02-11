import type CourseRow from '@csisp/infra-database/public/Course';
import type {
  CourseId,
  CourseInitializer,
} from '@csisp/infra-database/public/Course';
import {
  Column,
  DataType,
  Model,
  Table,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Default,
} from 'sequelize-typescript';

@Table({
  tableName: 'course',
  timestamps: true,
  underscored: true,
})
export class Course
  extends Model<CourseRow, CourseInitializer>
  implements CourseRow
{
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: CourseId;

  @AllowNull(false)
  @Column(DataType.STRING(50))
  course_code!: string;

  @AllowNull(false)
  @Column(DataType.STRING(255))
  course_name!: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  semester!: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  academic_year!: number;

  @AllowNull(true)
  @Column(DataType.JSONB)
  available_majors!: unknown;

  @AllowNull(true)
  @Column(DataType.TEXT)
  description!: string | null;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.DECIMAL(3, 1))
  credit!: string;

  @AllowNull(true)
  @Column(DataType.STRING(255))
  department!: string | null;

  @Default(1)
  @Column(DataType.INTEGER)
  status!: number;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  created_at!: Date;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  updated_at!: Date;
}
