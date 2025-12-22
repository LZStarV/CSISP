import { Model, DataTypes, Sequelize } from 'sequelize';
import { Status, Teacher as TeacherType } from '@csisp/types';

// 使用标准类型定义
interface TeacherAttributes extends Omit<TeacherType, 'id' | 'createdAt' | 'updatedAt'> {
  id: number;
  user_id: number;
  teacher_id: string;
  real_name: string;
  email: string;
  phone: string;
  department: string;
  title: string;
  status: Status;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

class Teacher extends Model<TeacherAttributes> implements TeacherAttributes {
  public id!: number;
  public user_id!: number;
  public teacher_id!: string;
  public real_name!: string;
  public email!: string;
  public phone!: string;
  public department!: string;
  public title!: string;
  public status!: Status;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // 关联方法
  public static associate(models: Record<string, any>) {
    Teacher.hasMany(models.Class, { foreignKey: 'teacher_id' });
  }
}

export default (sequelize: Sequelize, DataTypes: any) => {
  Teacher.init(
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
      teacher_id: {
        type: DataTypes.STRING(11),
        allowNull: false,
        unique: true,
        field: 'teacher_id',
      },
      real_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'real_name',
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      department: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
    },
    {
      sequelize,
      modelName: 'Teacher',
      tableName: 'teacher',
      timestamps: true,
      underscored: true,
    }
  );

  return Teacher;
};
