import type AttendanceTaskRow from '@csisp/infra-database/public/AttendanceTask';
import type {
  AttendanceTaskId,
  AttendanceTaskInitializer,
} from '@csisp/infra-database/public/AttendanceTask';
import type { CourseId } from '@csisp/infra-database/public/Course';
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
  tableName: 'attendance_task',
  timestamps: true,
  underscored: true,
})
export class AttendanceTask
  extends Model<AttendanceTaskRow, AttendanceTaskInitializer>
  implements AttendanceTaskRow
{
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: AttendanceTaskId;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  course_id!: CourseId;

  @AllowNull(false)
  @Column(DataType.STRING(255))
  title!: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  start_time!: Date;

  @AllowNull(false)
  @Column(DataType.DATE)
  end_time!: Date;

  @AllowNull(true)
  @Column(DataType.STRING(10))
  code!: string | null;

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
