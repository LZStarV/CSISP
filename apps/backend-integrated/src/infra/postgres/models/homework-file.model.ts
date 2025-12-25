import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table
export class HomeworkFile extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'submission_id' })
  submissionId!: number;

  @Column({ type: DataType.STRING(255), allowNull: false, field: 'file_name' })
  fileName!: string;

  @Column({ type: DataType.STRING(255), allowNull: false, field: 'file_path' })
  filePath!: string;

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'file_size' })
  fileSize?: number;

  @Column({ type: DataType.STRING(100), allowNull: true, field: 'file_type' })
  fileType?: string;

  @Column({ type: DataType.DATE, allowNull: false, field: 'upload_time' })
  uploadTime!: Date;
}
