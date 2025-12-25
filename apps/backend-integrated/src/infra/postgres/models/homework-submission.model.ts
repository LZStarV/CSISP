import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table
export class HomeworkSubmission extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'homework_id' })
  homeworkId!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'user_id' })
  userId!: number;

  @Column({ type: DataType.STRING(255), allowNull: false, field: 'file_path' })
  filePath!: string;

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'file_name' })
  fileName?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  content?: string;

  @Column({ type: DataType.STRING(20), defaultValue: 'submitted' })
  status!: string;

  @Column({ type: DataType.DATE, allowNull: false, field: 'submit_time' })
  submitTime!: Date;
}
