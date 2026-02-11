import {
  Table,
  Model,
  Column,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';

/**
 * 学期学年配置表：记录当前学期、起止日期等学术日历信息
 */
@Table({ tableName: 'academic_config', timestamps: false, underscored: true })
export class AcademicConfig extends Model<AcademicConfig> {
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
   * 学年（字符）
   */
  @Column({
    type: DataType.STRING(10),
    allowNull: false,
    comment: '学年（如 2025-2026）',
  })
  year!: string;

  /**
   * 学期（数字）
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '学期（数字）',
  })
  semester!: number;

  /**
   * 开始日期
   */
  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: '开始日期',
  })
  start_date!: Date;

  /**
   * 结束日期
   */
  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: '结束日期',
  })
  end_date!: Date;

  /**
   * 是否当前学期
   */
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: '是否当前学期',
  })
  is_current!: boolean;

  /**
   * 状态（1 正常）
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '状态（1 正常）',
  })
  status!: number;
}
