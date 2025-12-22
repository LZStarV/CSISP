import { Model, DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize, DataTypes: any) => {
  class AttendanceTask extends Model {
    static associate(models) {
      AttendanceTask.belongsTo(models.Course, { foreignKey: 'course_id' });
      AttendanceTask.hasMany(models.AttendanceRecord, { foreignKey: 'attendance_task_id' });
    }
  }

  AttendanceTask.init(
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
      task_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'task_name',
      },
      task_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'task_type',
      },
      start_time: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'start_time',
      },
      end_time: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'end_time',
      },
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
    },
    {
      sequelize,
      modelName: 'AttendanceTask',
      tableName: 'attendance_task',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    }
  );

  return AttendanceTask;
};
