import type UserRow from '@csisp/infra-database/public/User';
import type {
  UserId,
  UserInitializer,
} from '@csisp/infra-database/public/User';
import {
  BelongsToMany,
  Column,
  DataType,
  Model,
  Table,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Default,
} from 'sequelize-typescript';

import { Role } from './role.model';
import { UserRole } from './user-role.model';

@Table({
  tableName: 'user',
  timestamps: true,
  underscored: true,
})
export class User extends Model<UserRow, UserInitializer> implements UserRow {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: UserId;

  @AllowNull(false)
  @Column(DataType.STRING(50))
  username!: string;

  @AllowNull(false)
  @Column(DataType.STRING(255))
  password!: string;

  @AllowNull(false)
  @Column(DataType.STRING(255))
  real_name!: string;

  @AllowNull(false)
  @Column(DataType.STRING(11))
  student_id!: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  enrollment_year!: number;

  @AllowNull(false)
  @Column(DataType.STRING(100))
  major!: string;

  @Default(1)
  @Column(DataType.INTEGER)
  status!: number;

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  weak_password_flag!: boolean;

  @AllowNull(true)
  @Column(DataType.STRING(255))
  email!: string | null;

  @AllowNull(true)
  @Column(DataType.STRING(20))
  phone!: string | null;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  created_at!: Date;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  updated_at!: Date;

  @BelongsToMany(() => Role, () => UserRole)
  roles!: Role[];
}
