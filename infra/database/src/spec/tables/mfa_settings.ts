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
 * 用户多因素认证设置表：记录用户启用的各类 MFA 能力与是否必需
 */
@Table({ tableName: 'mfa_settings', timestamps: true, underscored: true })
export class MfaSettings extends Model<MfaSettings> {
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
   * 用户 ID（唯一约束，1:1 设置）
   */
  @Unique
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '用户 ID（唯一约束）',
  })
  user_id!: number;

  /**
   * 是否启用短信验证
   */
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: '是否启用短信验证',
  })
  sms_enabled!: boolean;

  /**
   * 是否启用邮箱验证
   */
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: '是否启用邮箱验证',
  })
  email_enabled!: boolean;

  /**
   * 是否启用 FIDO2（安全密钥）
   */
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: '是否启用 FIDO2（安全密钥）',
  })
  fido2_enabled!: boolean;

  /**
   * 是否启用一次性密码（TOTP）
   */
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: '是否启用一次性密码（TOTP）',
  })
  otp_enabled!: boolean;

  /**
   * 绑定手机号（用于短信验证）
   */
  @Column({
    type: DataType.STRING(20),
    allowNull: true,
    comment: '绑定手机号（用于短信验证）',
  })
  phone_number?: string | null;

  /**
   * 是否要求强制启用 MFA
   */
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: '是否要求强制启用 MFA',
  })
  required!: boolean;

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
