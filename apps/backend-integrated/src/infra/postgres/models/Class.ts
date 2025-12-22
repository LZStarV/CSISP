import { Model, DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize, DataTypes: any) => {
  class Class extends Model {
    static associate(models) {
      Class.belongsTo(models.Course, { foreignKey: 'course_id' });
      Class.belongsTo(models.Teacher, { foreignKey: 'teacher_id' });
      Class.hasMany(models.AttendanceTask, { foreignKey: 'class_id' });
      Class.hasMany(models.AttendanceRecord, { foreignKey: 'class_id' });
      Class.hasMany(models.Schedule, { foreignKey: 'class_id' });
    }
  }

  Class.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      class_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'class_name',
      },
      course_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'course_id',
      },
      teacher_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'teacher_id',
      },
      semester: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          isIn: [[1, 2]], // 对应Semester枚举值
        },
      },
      academic_year: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'academic_year',
      },
      max_students: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 50,
        field: 'max_students',
      },
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
    },
    {
      sequelize,
      modelName: 'Class',
      tableName: 'class',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    }
  );

  return Class;
};
