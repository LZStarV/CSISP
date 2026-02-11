import {
  Table,
  Model,
  Column,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';

/**
 * 作业文件表：记录提交的附件文件信息
 */
@Table({ tableName: 'homework_file', timestamps: false, underscored: true })
export class HomeworkFile extends Model<HomeworkFile> {
  /**
   * 主键 ID
   */
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '主键 ID',
  })
  id!: number;

  /**
   * 提交记录 ID
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '提交记录 ID',
  })
  submission_id!: number;

  /**
   * 文件名
   */
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: '文件名',
  })
  file_name!: string;

  /**
   * 文件路径
   */
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: '文件路径',
  })
  file_path!: string;

  /**
   * 文件大小（字节，可空）
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '文件大小（字节，可空）',
  })
  file_size?: number | null;

  /**
   * 文件类型（可空）
   */
  @Column({
    type: DataType.STRING(100),
    allowNull: true,
    comment: '文件类型（可空）',
  })
  file_type?: string | null;

  /**
   * 上传时间
   */
  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: '上传时间',
  })
  upload_time!: Date;
}
