import type TeacherRow from '@csisp/infra-database/public/Teacher';
import type {
  TeacherId,
  TeacherInitializer,
} from '@csisp/infra-database/public/Teacher';
import type { UserId } from '@csisp/infra-database/public/User';
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
  tableName: 'teacher',
  timestamps: true,
  underscored: true,
})
export class Teacher
  extends Model<TeacherRow, TeacherInitializer>
  implements TeacherRow
{
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: TeacherId;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  user_id!: UserId | null;

  @AllowNull(false)
  @Column(DataType.STRING(255))
  real_name!: string;

  @AllowNull(false)
  @Column(DataType.STRING(255))
  email!: string;

  @AllowNull(false)
  @Column(DataType.STRING(20))
  phone!: string;

  @AllowNull(false)
  @Column(DataType.STRING(255))
  department!: string;

  @AllowNull(true)
  @Column(DataType.STRING(50))
  title!: string | null;

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
