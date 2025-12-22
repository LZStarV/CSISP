import { Model, DataTypes, Sequelize } from 'sequelize';

class SubCourse extends Model {}

export default (sequelize: Sequelize) => {
  SubCourse.init(
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
      sub_course_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        field: 'sub_course_code',
      },
      teacher_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'teacher_id',
      },
      academic_year: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'academic_year',
      },
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
    },
    {
      sequelize,
      modelName: 'SubCourse',
      tableName: 'sub_course',
      timestamps: true,
      underscored: true,
    }
  );

  (SubCourse as any).associate = (models: Record<string, any>) => {
    models.Course.hasMany(SubCourse, { foreignKey: 'course_id' });
    SubCourse.belongsTo(models.Course, { foreignKey: 'course_id' });
    SubCourse.belongsTo(models.Teacher, { foreignKey: 'teacher_id' });
    SubCourse.hasMany(models.TimeSlot, { foreignKey: 'sub_course_id' });
  };

  return SubCourse;
};
