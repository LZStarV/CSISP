import { Model, DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize, DataTypes: any) => {
  const RolePermission = sequelize.define(
    'RolePermission',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'role_id',
      },
      permission_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'permission_id',
      },
    },
    {
      sequelize,
      modelName: 'RolePermission',
      tableName: 'role_permission',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      timestamps: true,
      underscored: true,
    }
  );

  RolePermission.associate = function (models) {
    RolePermission.belongsTo(models.Role, { foreignKey: 'role_id' });
    RolePermission.belongsTo(models.Permission, { foreignKey: 'permission_id' });
  };

  return RolePermission;
};
