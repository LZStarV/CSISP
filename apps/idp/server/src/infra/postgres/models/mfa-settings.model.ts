import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Default,
  Index,
} from 'sequelize-typescript';

@Table({
  tableName: 'mfa_settings',
  timestamps: true,
  underscored: true,
})
export class MfaSettingsModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @Index
  @AllowNull(false)
  @Column(DataType.INTEGER)
  user_id!: number;

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  sms_enabled!: boolean;

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  email_enabled!: boolean;

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  fido2_enabled!: boolean;

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  otp_enabled!: boolean;

  @AllowNull(true)
  @Column(DataType.STRING)
  phone_number!: string | null;

  @Default(true)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  required!: boolean;
}
