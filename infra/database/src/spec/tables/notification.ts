import {
  Table,
  Model,
  Column,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';

/**
 * 通知表：记录系统向用户发送的通知消息
 */
@Table({ tableName: 'notification', timestamps: true, underscored: true })
export class Notification extends Model<Notification> {
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
   * 通知类型
   */
  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '通知类型',
  })
  type!: string;

  /**
   * 标题
   */
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: '标题',
  })
  title!: string;

  /**
   * 内容
   */
  @Column({
    type: DataType.TEXT,
    allowNull: false,
    comment: '内容',
  })
  content!: string;

  /**
   * 目标用户 ID
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '目标用户 ID',
  })
  target_user_id!: number;

  /**
   * 发送者用户 ID
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '发送者用户 ID',
  })
  sender_id!: number;

  /**
   * 状态（默认 unread）
   */
  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    defaultValue: 'unread',
    comment: '状态（默认 unread）',
  })
  status!: string;

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
