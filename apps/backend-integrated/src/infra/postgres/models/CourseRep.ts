import { Model, DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize, DataTypes: any) => {
  class CourseRep extends Model {
    static associate(models) {
      CourseRep.belongsTo(models.User, { foreignKey: 'user_id' });
      CourseRep.belongsTo(models.Class, { foreignKey: 'class_id' });
    }
  }

  CourseRep.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
      },
      class_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'class_id',
      },
      responsibility: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      appointment_date: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'appointment_date',
      },
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
    },
    {
      sequelize,
      modelName: 'CourseRep',
      tableName: 'course_rep',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    }
  );

  return CourseRep;
};
