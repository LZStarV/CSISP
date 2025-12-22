import { Model, DataTypes, Sequelize } from 'sequelize';
import { Status, Permission as PermissionType } from '@csisp/types';

// 使用标准类型定义
interface PermissionAttributes extends Omit<PermissionType, 'id' | 'createdAt' | 'updatedAt'> {
  id: number;
  created_at?: Date;
  updated_at?: Date;
}

class Permission extends Model<PermissionAttributes> implements PermissionAttributes {
  public id!: number;
  public name!: string;
  public code!: string;
  public description!: string;
  public status!: Status;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // 关联方法
  public static associate(models: Record<string, any>) {
    Permission.belongsToMany(models.Role, {
      through: models.RolePermission,
      foreignKey: 'permission_id',
    });
  }
}

export default (sequelize: Sequelize, DataTypes: any) => {
  Permission.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      description: {
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
      modelName: 'Permission',
      tableName: 'permission',
      timestamps: true,
      underscored: true,
    }
  );

  return Permission;
};
