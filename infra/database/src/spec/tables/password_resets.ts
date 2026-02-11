import {
  Table,
  Model,
  Column,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';

/**
 * 密码重置表：记录用户发起的重置令牌与有效期、使用状态
 */
@Table({ tableName: 'password_resets', timestamps: true, underscored: true })
export class PasswordResets extends Model<PasswordResets> {
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
   * 用户 ID（关联到 user 表）
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '用户 ID（关联到 user 表）',
  })
  user_id!: number;

  /**
   * 重置令牌哈希（安全存储）
   */
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: '重置令牌哈希',
  })
  token_hash!: string;

  /**
   * 令牌过期时间
   */
  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: '令牌过期时间',
  })
  expires_at!: Date;

  /**
   * 是否已使用
   */
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: '是否已使用',
  })
  used!: boolean;

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
