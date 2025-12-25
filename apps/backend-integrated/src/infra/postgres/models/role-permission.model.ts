import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table
export class RolePermission extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'role_id' })
  roleId!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'permission_id' })
  permissionId!: number;
}
