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
  tableName: 'oidc_clients',
  timestamps: false,
  underscored: true,
})
export class OidcClientModel extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  client_id!: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  client_secret!: string | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  name!: string | null;

  @AllowNull(false)
  @Column(DataType.JSONB)
  allowed_redirect_uris!: string[];

  @AllowNull(false)
  @Column(DataType.JSONB)
  scopes!: string[];

  @Default('active')
  @AllowNull(false)
  @Column(DataType.STRING)
  status!: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  created_by!: string | null;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  created_at!: Date;
}
