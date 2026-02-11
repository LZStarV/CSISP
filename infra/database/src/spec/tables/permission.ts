import {
  Table,
  Model,
  Column,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';

/**
 * 权限表：定义原子权限点
 */
@Table({ tableName: 'permission', timestamps: false, underscored: true })
export class Permission extends Model<Permission> {
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
   * 权限名称（唯一）
   */
  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '权限名称（唯一）',
  })
  name!: string;

  /**
   * 权限编码（唯一）
   */
  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '权限编码（唯一）',
  })
  code!: string;

  /**
   * 权限描述
   */
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: '权限描述',
  })
  description!: string;

  /**
   * 状态（1 正常）
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '状态（1 正常）',
  })
  status!: number;
}
