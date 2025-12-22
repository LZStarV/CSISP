import { Model, DataTypes, Sequelize } from 'sequelize';

class HomeworkFile extends Model {}

export default (sequelize: Sequelize) => {
  HomeworkFile.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      submission_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'submission_id',
      },
      file_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'file_name',
      },
      file_path: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'file_path',
      },
      file_size: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'file_size',
      },
      file_type: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'file_type',
      },
      upload_time: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'upload_time',
      },
    },
    {
      sequelize,
      modelName: 'HomeworkFile',
      tableName: 'homework_file',
      timestamps: true,
      underscored: true,
    }
  );

  (HomeworkFile as any).associate = (models: Record<string, any>) => {
    HomeworkFile.belongsTo(models.HomeworkSubmission, { foreignKey: 'submission_id' });
    models.HomeworkSubmission.hasMany(HomeworkFile, { foreignKey: 'submission_id' });
  };

  return HomeworkFile;
};
