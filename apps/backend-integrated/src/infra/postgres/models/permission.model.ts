import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table
export class Permission extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @Column({ type: DataType.STRING(50), allowNull: false, unique: true })
  name!: string;

  @Column({ type: DataType.STRING(50), allowNull: false, unique: true })
  code!: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  description!: string;

  @Column({ type: DataType.INTEGER, defaultValue: 1 })
  status!: number;
}
