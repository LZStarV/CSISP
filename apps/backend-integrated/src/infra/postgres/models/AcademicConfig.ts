import { Model, DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize, DataTypes: any) => {
  class AcademicConfig extends Model {
    // 关联方法
    static associate(models) {
      // 暂无关联
    }
  }

  AcademicConfig.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      year: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      semester: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          isIn: [[1, 2]],
        },
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'start_date',
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'end_date',
      },
      is_current: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_current',
      },
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
    },
    {
      sequelize,
      modelName: 'AcademicConfig',
      tableName: 'academic_config',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    }
  );

  return AcademicConfig;
};
