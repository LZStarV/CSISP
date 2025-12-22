import { Model, DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize, DataTypes: any) => {
  class Course extends Model {
    static associate(models) {
      Course.hasMany(models.Class, { foreignKey: 'course_id' });
      Course.hasMany(models.AttendanceTask, { foreignKey: 'course_id' });
      Course.hasMany(models.Homework, { foreignKey: 'course_id' });
      Course.hasMany(models.CourseRep, { foreignKey: 'course_id' });
    }
  }

  Course.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      course_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'course_name',
      },
      course_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        field: 'course_code',
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
      available_majors: {
        type: DataTypes.JSON,
        allowNull: false,
        field: 'available_majors',
      },
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
    },
    {
      sequelize,
      modelName: 'Course',
      tableName: 'course',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    }
  );

  return Course;
};
