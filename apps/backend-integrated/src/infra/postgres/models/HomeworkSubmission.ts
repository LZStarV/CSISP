import { Model, DataTypes, Sequelize } from 'sequelize';
import { HomeworkSubmission as HomeworkSubmissionType } from '@csisp/types';

// 使用标准类型定义
interface HomeworkSubmissionAttributes extends Omit<
  HomeworkSubmissionType,
  'id' | 'submitTime' | 'updatedAt'
> {
  id: number;
  homeworkId: number;
  userId: number;
  submitTime: Date;
  created_at?: Date;
  updated_at?: Date;
}

class HomeworkSubmission
  extends Model<HomeworkSubmissionAttributes>
  implements HomeworkSubmissionAttributes
{
  public id!: number;
  public homeworkId!: number;
  public userId!: number;
  public filePath!: string;
  public fileName?: string;
  public content?: string;
  public status!: string;
  public submitTime!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // 关联方法
  public static associate(models: Record<string, any>) {
    HomeworkSubmission.belongsTo(models.Homework, { foreignKey: 'homework_id' });
    HomeworkSubmission.belongsTo(models.User, { foreignKey: 'user_id' });
  }
}

export default (sequelize: Sequelize, DataTypes: any) => {
  HomeworkSubmission.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      homework_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'homework_id',
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
      },
      file_path: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'file_path',
      },
      file_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'file_name',
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(20),
        defaultValue: 'submitted',
      },
      submit_time: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'submit_time',
      },
    },
    {
      sequelize,
      modelName: 'HomeworkSubmission',
      tableName: 'homework_submission',
      timestamps: true,
      underscored: true,
    }
  );

  return HomeworkSubmission;
};
