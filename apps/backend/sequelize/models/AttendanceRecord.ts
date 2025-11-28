import { Model, DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize, DataTypes: any) => {
  class AttendanceRecord extends Model {
    static associate(models) {
      AttendanceRecord.belongsTo(models.AttendanceTask, { foreignKey: 'task_id' });
      AttendanceRecord.belongsTo(models.User, { foreignKey: 'user_id' });
    }
  }

  AttendanceRecord.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      attendance_task_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'task_id',
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          isIn: [['normal', 'late', 'absent', 'leave', 'not_checked']],
        },
      },
      remark: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'AttendanceRecord',
      tableName: 'attendance_record',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    }
  );

  return AttendanceRecord;
};
