import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table
export class Schedule extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'class_id' })
  classId!: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  weekday!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'time_slot_id' })
  timeSlotId!: number;

  @Column({ type: DataType.STRING(100), allowNull: false })
  room!: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  location!: string;
}
