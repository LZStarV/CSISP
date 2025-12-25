import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table
export class Notification extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @Column({ type: DataType.STRING(50), allowNull: false })
  type!: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  title!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  content!: string;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'target_user_id' })
  targetUserId!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'sender_id' })
  senderId!: number;

  @Column({ type: DataType.STRING(20), defaultValue: 'unread' })
  status!: string;
}
