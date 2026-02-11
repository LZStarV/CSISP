import type NotificationRow from '@csisp/infra-database/public/Notification';
import type {
  NotificationId,
  NotificationInitializer,
} from '@csisp/infra-database/public/Notification';
import type { UserId } from '@csisp/infra-database/public/User';
import {
  Column,
  DataType,
  Model,
  Table,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Default,
} from 'sequelize-typescript';

@Table({
  tableName: 'notification',
  timestamps: true,
  underscored: true,
})
export class Notification
  extends Model<NotificationRow, NotificationInitializer>
  implements NotificationRow
{
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: NotificationId;

  @AllowNull(false)
  @Default('system')
  @Column(DataType.STRING(50))
  type!: string;

  @AllowNull(false)
  @Column(DataType.STRING(255))
  title!: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  content!: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  target_user_id!: UserId;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  sender_id!: number;

  @Default('unread')
  @AllowNull(false)
  @Column(DataType.STRING(20))
  status!: string;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  created_at!: Date;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  updated_at!: Date;
}
