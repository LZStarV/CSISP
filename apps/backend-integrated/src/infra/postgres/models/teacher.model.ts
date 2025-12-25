import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'teacher',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Teacher extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'user_id' })
  userId!: number;

  @Column({ type: DataType.STRING(255), allowNull: false, field: 'real_name' })
  realName!: string;

  @Column({ type: DataType.STRING(255), allowNull: false, unique: true })
  email!: string;

  @Column({ type: DataType.STRING(20), allowNull: false })
  phone!: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  department!: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  title!: string;

  @Column({ type: DataType.INTEGER, defaultValue: 1 })
  status!: number;
}
