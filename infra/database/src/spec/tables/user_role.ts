import {
  Table,
  Model,
  Column,
  DataType,
  PrimaryKey,
} from 'sequelize-typescript';

/**
 * 用户角色关联表：用户与角色的多对多关联
 */
@Table({ tableName: 'user_role', timestamps: true, underscored: true })
export class UserRole extends Model<UserRole> {
  /**
   * 用户 ID（复合主键）
   */
  @PrimaryKey
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '用户 ID（复合主键）',
  })
  user_id!: number;

  /**
   * 角色 ID（复合主键）
   */
  @PrimaryKey
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '角色 ID（复合主键）',
  })
  role_id!: number;

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
