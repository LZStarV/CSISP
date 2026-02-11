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
 * 用户基础信息表：记录登录账号、学籍信息与联系信息
 */
@Table({ tableName: 'user', timestamps: true, underscored: true })
export class User extends Model<User> {
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
   * 登录用户名（唯一）
   */
  @Unique
  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '登录用户名（唯一）',
  })
  username!: string;

  /**
   * 登录密码哈希
   */
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: '登录密码哈希',
  })
  password!: string;

  /**
   * 真实姓名
   */
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: '真实姓名',
  })
  real_name!: string;

  /**
   * 学号（唯一）
   */
  @Unique
  @Column({
    type: DataType.STRING(11),
    allowNull: false,
    comment: '学号（唯一）',
  })
  student_id!: string;

  /**
   * 入学年份
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '入学年份',
  })
  enrollment_year!: number;

  /**
   * 所属专业
   */
  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    comment: '所属专业',
  })
  major!: string;

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
   * 弱密码标记
   */
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: '弱密码标记',
  })
  weak_password_flag!: boolean;

  /**
   * 邮箱（唯一，可空）
   */
  @Unique
  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    comment: '邮箱（唯一，可空）',
  })
  email?: string | null;

  /**
   * 手机号（唯一，可空）
   */
  @Unique
  @Column({
    type: DataType.STRING(20),
    allowNull: true,
    comment: '手机号（唯一，可空）',
  })
  phone?: string | null;

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
