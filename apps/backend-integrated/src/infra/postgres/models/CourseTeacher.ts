import { Model, DataTypes, Sequelize } from 'sequelize';

class CourseTeacher extends Model {}

export default (sequelize: Sequelize) => {
  CourseTeacher.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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
    },
    {
      sequelize,
      modelName: 'CourseTeacher',
      tableName: 'course_teacher',
      timestamps: true,
      underscored: true,
    }
  );

  (CourseTeacher as any).associate = (models: Record<string, any>) => {
    models.Course.belongsToMany(models.Teacher, {
      through: CourseTeacher,
      foreignKey: 'course_id',
      otherKey: 'teacher_id',
    });
    models.Teacher.belongsToMany(models.Course, {
      through: CourseTeacher,
      foreignKey: 'teacher_id',
      otherKey: 'course_id',
    });
  };

  return CourseTeacher;
};
