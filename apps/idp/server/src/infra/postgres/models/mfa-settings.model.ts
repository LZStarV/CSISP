import type MfaSettings from '@pgtype/MfaSettings';
import type { MfaSettingsId } from '@pgtype/MfaSettings';
import type { UserId } from '@pgtype/User';
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
export class MfaSettingsModel extends Model implements MfaSettings {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: MfaSettingsId;

  @Index
  @AllowNull(false)
  @Column(DataType.INTEGER)
  user_id!: UserId;

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

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  created_at!: Date;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  updated_at!: Date;
}
