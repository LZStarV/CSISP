import type OidcKeys from '@csisp/infra-database/public/OidcKeys';
import type { OidcKeysKid } from '@csisp/infra-database/public/OidcKeys';
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
  @Column(DataType.TEXT)
  private_pem_enc!: string;

  @Default('active')
  @AllowNull(false)
  @Column(DataType.STRING)
  status!: string;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  created_at!: Date;
}
