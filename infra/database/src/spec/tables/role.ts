import {
  Table,
  Model,
  Column,
  DataType,
  PrimaryKey,
  AutoIncrement,
  Unique,
} from 'sequelize-typescript';

/**
 * 角色表：定义系统角色与权限聚合
 */
@Table({ tableName: 'role', timestamps: true, underscored: true })
export class Role extends Model<Role> {
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
   * 角色名称（唯一）
   */
  @Unique
  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '角色名称（唯一）',
  })
  name!: string;

  /**
   * 角色编码（唯一）
   */
  @Unique
  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '角色编码（唯一）',
  })
  code!: string;

  /**
   * 角色描述
   */
  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '角色描述',
  })
  description?: string | null;

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

  /**
   * 创建时间
   */
  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    comment: '创建时间',
  })
  created_at!: Date;

  /**
   * 更新时间
   */
  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    comment: '更新时间',
  })
  updated_at!: Date;
}
