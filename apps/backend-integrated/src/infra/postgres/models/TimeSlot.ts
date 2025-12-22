import { Model, DataTypes, Sequelize } from 'sequelize';
import { Status, TimeSlot as TimeSlotType } from '@csisp/types';

interface TimeSlotAttributes {
  id: number;
  course_id: number;
  week_day: number;
  start_time: string;
  end_time: string;
  location: string;
  status: Status;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

class TimeSlot extends Model<TimeSlotAttributes> implements TimeSlotAttributes {
  public id!: number;
  public course_id!: number;
  public week_day!: number;
  public start_time!: string;
  public end_time!: string;
  public location!: string;
  public status!: Status;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // 关联方法
  public static associate(models: Record<string, any>) {
    TimeSlot.hasMany(models.Schedule, { foreignKey: 'time_slot_id' });
    TimeSlot.belongsTo(models.Course, { foreignKey: 'course_id' });
    models.Course.hasMany(TimeSlot, { foreignKey: 'course_id' });
  }
}

export default (sequelize: Sequelize, DataTypes: any) => {
  TimeSlot.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      course_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'course_id',
      },
      week_day: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 7,
        },
        field: 'week_day',
      },
      start_time: {
        type: DataTypes.STRING(10),
        allowNull: false,
        field: 'start_time',
      },
      end_time: {
        type: DataTypes.STRING(10),
        allowNull: false,
        field: 'end_time',
      },
      location: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
    },
    {
      sequelize,
      modelName: 'TimeSlot',
      tableName: 'time_slot',
      timestamps: true,
      underscored: true,
    }
  );

  return TimeSlot;
};
