import { Model, DataTypes, Sequelize } from 'sequelize';

interface ScheduleAttributes {
  id: number;
  class_id: number;
  weekday: number;
  time_slot_id: number;
  room: string;
  location: string;
  created_at?: Date;
  updated_at?: Date;
}

class Schedule extends Model<ScheduleAttributes> implements ScheduleAttributes {
  public id!: number;
  public class_id!: number;
  public weekday!: number;
  public time_slot_id!: number;
  public room!: string;
  public location!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // 关联方法
  public static associate(models: Record<string, any>) {
    // 多对一关系：Schedule - Class
    Schedule.belongsTo(models.Class, {
      foreignKey: 'class_id',
    });

    // 多对一关系：Schedule - TimeSlot
    Schedule.belongsTo(models.TimeSlot, {
      foreignKey: 'time_slot_id',
    });
  }
}

export default (sequelize: Sequelize, DataTypes: any) => {
  Schedule.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      class_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'class',
          key: 'id',
        },
      },
      weekday: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 7,
        },
      },
      time_slot_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'time_slot',
          key: 'id',
        },
      },
      room: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      location: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Schedule',
      tableName: 'schedule',
      timestamps: true,
      underscored: true,
    }
  );

  return Schedule;
};
