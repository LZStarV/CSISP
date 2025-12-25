import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table
export class AcademicConfigModel extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @Column({
    type: DataType.STRING(10),
    allowNull: false,
  })
  year!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  semester!: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'start_date',
  })
  startDate!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'end_date',
  })
  endDate!: Date;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_current',
  })
  isCurrent!: boolean;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 1,
  })
  status!: number;
}
