import type User from '@csisp/infra-database/public/User';
import type { UserId } from '@csisp/infra-database/public/User';
import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Default,
} from 'sequelize-typescript';

@Table({
  tableName: 'user',
  timestamps: true,
  underscored: true,
})
export class UserModel extends Model implements User {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: UserId;

  @AllowNull(false)
  @Column(DataType.STRING)
  username!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  password!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  real_name!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  student_id!: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  enrollment_year!: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  major!: string;

  @Default(1)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  status!: number;

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  weak_password_flag!: boolean;

  @AllowNull(true)
  @Column(DataType.STRING)
  email!: string | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  phone!: string | null;

  @AllowNull(false)
  @Default([])
  @Column(DataType.JSONB)
  roles!: string[];

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  created_at!: Date;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  updated_at!: Date;
}
