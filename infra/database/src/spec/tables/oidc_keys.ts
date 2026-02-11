import {
  Table,
  Model,
  Column,
  DataType,
  PrimaryKey,
} from 'sequelize-typescript';

/**
 * OIDC 密钥表：存储签发/验证所需的密钥材料与状态信息
 */
@Table({
  tableName: 'oidc_keys',
  timestamps: false,
  underscored: true,
})
export class OidcKeys extends Model<OidcKeys> {
  /**
   * 密钥唯一标识（Key ID）
   */
  @PrimaryKey
  @Column({
    type: DataType.STRING(128),
    allowNull: false,
    comment: 'OIDC 密钥唯一标识（kid）',
  })
  kid!: string;

  /**
   * 密钥类型（如 RSA、EC）
   */
  @Column({
    type: DataType.STRING(16),
    allowNull: false,
    comment: '密钥类型（kty）',
  })
  kty!: string;

  /**
   * 算法（如 RS256）
   */
  @Column({
    type: DataType.STRING(16),
    allowNull: false,
    comment: '算法（alg）',
  })
  alg!: string;

  /**
   * 用途（sig/enc）
   */
  @Column({
    type: DataType.STRING(8),
    allowNull: false,
    comment: '用途（use：sig/enc）',
  })
  use!: string;

  /**
   * 公钥 PEM
   */
  @Column({
    type: DataType.TEXT,
    allowNull: false,
    comment: '公钥 PEM',
  })
  public_pem!: string;

  /**
   * 私钥加密存储（BLOB）
   */
  @Column({
    type: DataType.BLOB,
    allowNull: false,
    comment: '私钥加密存储（BLOB）',
  })
  private_pem_enc!: Buffer;

  /**
   * 状态（active/disabled 等）
   */
  @Column({
    type: DataType.STRING(16),
    allowNull: false,
    defaultValue: 'active',
    comment: '状态（active/disabled 等）',
  })
  status!: string;

  /**
   * 激活时间
   */
  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '激活时间',
  })
  activated_at?: Date | null;

  /**
   * 过期时间
   */
  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '过期时间',
  })
  expires_at?: Date | null;

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
   * 轮换时间（如有轮换）
   */
  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '轮换时间',
  })
  rotated_at?: Date | null;
}
