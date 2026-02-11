import {
  Table,
  Model,
  Column,
  DataType,
  PrimaryKey,
  AutoIncrement,
  Unique,
} from 'sequelize-typescript';

/**
 * 教师表：记录教师的基本信息与所属院系
 */
@Table({ tableName: 'teacher', timestamps: true, underscored: true })
export class Teacher extends Model<Teacher> {
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
   * 关联用户 ID（可空）
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '关联用户 ID（可空）',
  })
  user_id?: number | null;

  /**
   * 教师姓名
   */
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: '教师姓名',
  })
  real_name!: string;

  /**
   * 邮箱（唯一）
   */
  @Unique
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: '邮箱（唯一）',
  })
  email!: string;

  /**
   * 手机号（唯一）
   */
  @Unique
  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    comment: '手机号（唯一）',
  })
  phone!: string;

  /**
   * 所属院系
   */
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: '所属院系',
  })
  department!: string;

  /**
   * 职称（可空）
   */
  @Column({
    type: DataType.STRING(100),
    allowNull: true,
    comment: '职称（可空）',
  })
  title?: string | null;

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
