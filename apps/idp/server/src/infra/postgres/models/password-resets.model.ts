import type PasswordResets from '@csisp/infra-database/public/PasswordResets';
import type { PasswordResetsId } from '@csisp/infra-database/public/PasswordResets';
import type { UserId } from '@csisp/infra-database/public/User';
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
  tableName: 'password_resets',
  timestamps: true,
  underscored: true,
})
export class PasswordResetsModel extends Model implements PasswordResets {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: PasswordResetsId;

  @Index
  @AllowNull(false)
  @Column(DataType.INTEGER)
  user_id!: UserId;

  @AllowNull(false)
  @Column(DataType.STRING)
  token_hash!: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  expires_at!: Date;

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  used!: boolean;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  created_at!: Date;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  updated_at!: Date;
}
