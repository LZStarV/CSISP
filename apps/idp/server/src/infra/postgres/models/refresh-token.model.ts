import type RefreshTokens from '@csisp/infra-database/public/RefreshTokens';
import type { RefreshTokensId } from '@csisp/infra-database/public/RefreshTokens';
import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Default,
} from 'sequelize-typescript';

@Table({
  tableName: 'refresh_tokens',
  timestamps: false,
  underscored: true,
})
export class RefreshTokenModel extends Model implements RefreshTokens {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: RefreshTokensId;

  @AllowNull(false)
  @Column(DataType.STRING)
  client_id!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  sub_hash!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  rt_hash!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  status!: string;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  created_at!: Date;

  @AllowNull(true)
  @Column(DataType.DATE)
  last_used_at!: Date | null;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  prev_id!: number | null;
}
