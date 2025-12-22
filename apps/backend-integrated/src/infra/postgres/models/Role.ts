import { Model, DataTypes, Sequelize } from 'sequelize';
import { Status, Role as RoleType } from '@csisp/types';

// 使用标准类型定义
interface RoleAttributes extends Omit<RoleType, 'id' | 'createdAt' | 'updatedAt'> {
  id: number;
  created_at?: Date;
  updated_at?: Date;
}

class Role extends Model<RoleAttributes> implements RoleAttributes {
  public id!: number;
  public name!: string;
  public code!: string;
  public description!: string;
  public status!: Status;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // 关联方法
  public static associate(models: Record<string, any>) {
    Role.belongsToMany(models.User, { through: models.UserRole, foreignKey: 'role_id' });
    Role.belongsToMany(models.Permission, {
      through: models.RolePermission,
      foreignKey: 'role_id',
    });
  }
}

export default (sequelize: Sequelize, DataTypes: any) => {
  Role.init(
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
      modelName: 'Role',
      tableName: 'role',
      timestamps: true,
      underscored: true,
    }
  );

  return Role;
};
