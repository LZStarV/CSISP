import { Model, DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize, DataTypes: any) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      student_id: {
        type: DataTypes.STRING(11),
        allowNull: false,
        unique: true,
        field: 'student_id',
      },
      enrollment_year: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 2000,
          max: 3000,
        },
        field: 'enrollment_year',
      },
      major: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      real_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'real_name',
      },
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'user',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      timestamps: true,
      underscored: true,
    }
  );

  User.associate = function (models) {
    User.belongsToMany(models.Role, {
      through: models.UserRole,
      foreignKey: 'user_id',
      otherKey: 'role_id',
    });
    User.hasMany(models.Notification, {
      foreignKey: 'user_id',
    });
    User.hasMany(models.HomeworkSubmission, {
      foreignKey: 'student_id',
    });
  };

  return User;
};
