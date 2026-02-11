import {
  Table,
  Model,
  Column,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';

@Table({
  tableName: 'homework_submission',
  timestamps: true,
  underscored: true,
})
export class HomeworkSubmission extends Model<HomeworkSubmission> {
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
   * 作业 ID
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '作业 ID',
  })
  homework_id!: number;

  /**
   * 学生用户 ID
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '学生用户 ID',
  })
  user_id!: number;

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
   * 文件名（可空）
   */
  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    comment: '文件名（可空）',
  })
  file_name?: string | null;

  /**
   * 文本内容（可空）
   */
  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '文本内容（可空）',
  })
  content?: string | null;

  /**
   * 状态（默认 submitted）
   */
  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    defaultValue: 'submitted',
    comment: '状态（默认 submitted）',
  })
  status!: string;

  /**
   * 提交时间
   */
  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: '提交时间',
  })
  submit_time!: Date;

  /**
   * 创建时间
   */
  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    comment: '创建时间',
  })
  created_at!: Date;

  /**
   * 更新时间
   */
  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    comment: '更新时间',
  })
  updated_at!: Date;
}
