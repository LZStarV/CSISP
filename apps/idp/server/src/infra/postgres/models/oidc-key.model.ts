import type OidcKeys from '@pgtype/OidcKeys';
import type { OidcKeysKid } from '@pgtype/OidcKeys';
import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AllowNull,
  Default,
} from 'sequelize-typescript';

@Table({
  tableName: 'oidc_keys',
  timestamps: false,
  underscored: true,
})
export class OidcKeyModel extends Model implements OidcKeys {
  @PrimaryKey
  @Column(DataType.STRING)
  kid!: OidcKeysKid;

  @AllowNull(false)
  @Column(DataType.STRING)
  kty!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  alg!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  use!: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  public_pem!: string;

  @AllowNull(false)
  @Column(DataType.BLOB)
  private_pem_enc!: Buffer;

  @Default('active')
  @AllowNull(false)
  @Column(DataType.STRING)
  status!: string;

  @AllowNull(true)
  @Column(DataType.DATE)
  activated_at!: Date | null;

  @AllowNull(true)
  @Column(DataType.DATE)
  expires_at!: Date | null;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  created_at!: Date;

  @AllowNull(true)
  @Column(DataType.DATE)
  rotated_at!: Date | null;
}
