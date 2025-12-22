import { Model, DataTypes, Sequelize } from 'sequelize';
import { Notification as NotificationType } from '@csisp/types';

// 使用标准类型定义
interface NotificationAttributes extends Omit<NotificationType, 'id' | 'createdAt' | 'updatedAt'> {
  id: number;
  targetUserId: number;
  senderId: number;
  created_at?: Date;
  updated_at?: Date;
}

class Notification extends Model<NotificationAttributes> implements NotificationAttributes {
  public id!: number;
  public type!: string;
  public title!: string;
  public content!: string;
  public targetUserId!: number;
  public senderId!: number;
  public status!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // 关联方法
  public static associate(models: Record<string, any>) {
    Notification.belongsTo(models.User, { foreignKey: 'sender_id' });
    Notification.belongsTo(models.User, { foreignKey: 'target_user_id' });
  }
}

export default (sequelize: Sequelize, DataTypes: any) => {
  Notification.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      target_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'target_user_id',
      },
      sender_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'sender_id',
      },
      status: {
        type: DataTypes.STRING(20),
        defaultValue: 'unread',
      },
    },
    {
      sequelize,
      modelName: 'Notification',
      tableName: 'notification',
      timestamps: true,
      underscored: true,
    }
  );

  return Notification;
};
