import { BelongsToMany, Column, DataType, Model, Table } from 'sequelize-typescript';
import type RoleRow from '../generated/public/Role';
import type { RoleInitializer } from '../generated/public/Role';
import { User } from './user.model';
import { UserRole } from './user-role.model';

@Table({
  tableName: 'role',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Role extends Model<RoleRow, RoleInitializer> {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @Column({ type: DataType.STRING(50), allowNull: false, unique: true })
  name!: string;

  @Column({ type: DataType.STRING(50), allowNull: false, unique: true })
  code!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  description!: string;

  @Column({ type: DataType.INTEGER, defaultValue: 1 })
  status!: number;

  @BelongsToMany(() => User, () => UserRole)
  users?: User[];
}
