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
export class PasswordResetsModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @Index
  @AllowNull(false)
  @Column(DataType.INTEGER)
  user_id!: number;

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
}
