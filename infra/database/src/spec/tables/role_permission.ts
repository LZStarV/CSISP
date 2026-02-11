import {
  Table,
  Model,
  Column,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';

/**
 * 角色-权限关联表：角色与权限的多对多关系
 */
@Table({ tableName: 'role_permission', timestamps: false, underscored: true })
export class RolePermission extends Model<RolePermission> {
  /**
   * 主键 ID
   */
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '主键 ID',
  })
  id!: number;

  /**
   * 角色 ID
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '角色 ID',
  })
  role_id!: number;

  /**
   * 权限 ID
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '权限 ID',
  })
  permission_id!: number;
}
