import { Model, DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize, DataTypes: any) => {
  const UserRole = sequelize.define(
    'UserRole',
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
      role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'role_id',
      },
    },
    {
      sequelize,
      modelName: 'UserRole',
      tableName: 'user_role',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      timestamps: true,
      underscored: true,
    }
  );

  UserRole.associate = function (models) {
    UserRole.belongsTo(models.User, { foreignKey: 'user_id' });
    UserRole.belongsTo(models.Role, { foreignKey: 'role_id' });
  };

  return UserRole;
};
