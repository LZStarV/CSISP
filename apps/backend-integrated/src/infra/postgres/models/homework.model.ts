import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table
export class Homework extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'class_id' })
  classId!: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  title!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  content!: string;

  @Column({ type: DataType.DATE, allowNull: false })
  deadline!: Date;

  @Column({ type: DataType.INTEGER, defaultValue: 1 })
  status!: number;
}
