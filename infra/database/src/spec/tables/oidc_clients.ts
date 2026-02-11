import {
  Table,
  Model,
  Column,
  DataType,
  PrimaryKey,
} from 'sequelize-typescript';

/**
 * OIDC 客户端表：存储可接入的 OAuth/OIDC 应用及其权限范围与重定向地址等信息
 */
@Table({
  tableName: 'oidc_clients',
  timestamps: false,
  underscored: true,
})
export class OidcClients extends Model<OidcClients> {
  /**
   * 客户端唯一标识（client_id）
   */
  @PrimaryKey
  @Column({
    type: DataType.STRING(128),
    allowNull: false,
    comment: 'OIDC 客户端唯一标识',
  })
  client_id!: string;

  /**
   * 客户端密钥（可为空，支持仅公钥方式）
   */
  @Column({
    type: DataType.STRING(256),
    allowNull: true,
    comment: 'OIDC 客户端密钥（可选）',
  })
  client_secret?: string | null;

  /**
   * 客户端展示名称
   */
  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    comment: '客户端名称（显示用）',
  })
  name?: string | null;

  /**
   * 允许的重定向地址列表（JSONB）
   */
  @Column({
    type: DataType.JSONB,
    allowNull: false,
    comment: '允许的重定向地址列表（JSONB）',
  })
  allowed_redirect_uris!: unknown;

  /**
   * 授权范围列表（JSONB）
   */
  @Column({
    type: DataType.JSONB,
    allowNull: false,
    comment: '授权范围列表（JSONB）',
  })
  scopes!: unknown;

  /**
   * 客户端状态（active/disabled 等）
   */
  @Column({
    type: DataType.STRING(16),
    allowNull: false,
    defaultValue: 'active',
    comment: '状态（active/disabled 等）',
  })
  status!: string;

  /**
   * 创建者标识（审计）
   */
  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    comment: '创建者标识（审计）',
  })
  created_by?: string | null;

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
}
