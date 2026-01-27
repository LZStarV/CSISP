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
  tableName: 'user',
  timestamps: true,
  underscored: true,
})
export class UserModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  username!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  password!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  real_name!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  student_id!: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  enrollment_year!: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  major!: string;

  @Default(1)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  status!: number;

  @AllowNull(true)
  @Column(DataType.STRING)
  email!: string | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  phone!: string | null;
}
