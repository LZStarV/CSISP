import type RoleRow from '@csisp/infra-database/public/Role';
import type {
  RoleId,
  RoleInitializer,
} from '@csisp/infra-database/public/Role';
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

import { UserRole } from './user-role.model';
import { User } from './user.model';

@Table({
  tableName: 'role',
  timestamps: true,
  underscored: true,
})
export class Role extends Model<RoleRow, RoleInitializer> implements RoleRow {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: RoleId;

  @AllowNull(false)
  @Column(DataType.STRING(50))
  name!: string;

  @AllowNull(false)
  @Column(DataType.STRING(50))
  code!: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  description!: string | null;

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

  @BelongsToMany(() => User, () => UserRole)
  users?: User[];
}
