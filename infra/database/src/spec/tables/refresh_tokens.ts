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
 * 刷新令牌表：记录各客户端的刷新令牌链与状态，用于会话续期
 */
@Table({ tableName: 'refresh_tokens', timestamps: false, underscored: true })
export class RefreshTokens extends Model<RefreshTokens> {
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
   * 客户端标识（client_id）
   */
  @Column({
    type: DataType.STRING(128),
    allowNull: false,
    comment: '客户端标识（client_id）',
  })
  client_id!: string;

  /**
   * 用户主体哈希（隐私保护）
   */
  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    comment: '用户主体哈希（sub_hash）',
  })
  sub_hash!: string;

  /**
   * 刷新令牌哈希（唯一）
   */
  @Unique
  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    comment: '刷新令牌哈希（唯一）',
  })
  rt_hash!: string;

  /**
   * 状态（active/revoked 等）
   */
  @Column({
    type: DataType.STRING(16),
    allowNull: false,
    defaultValue: 'active',
    comment: '状态（active/revoked 等）',
  })
  status!: string;

  /**
   * 前一个令牌 ID（令牌链）
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '前一个令牌 ID（令牌链）',
  })
  prev_id?: number | null;

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
   * 最后使用时间
   */
  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '最后使用时间',
  })
  last_used_at?: Date | null;
}
