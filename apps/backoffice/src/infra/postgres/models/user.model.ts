import type User from '@csisp/infra-database/public/User';
import type { UserInitializer } from '@csisp/infra-database/public/User';
import { DataTypes, type ModelDefined } from 'sequelize';

import { getSequelize } from '../client';

export function defineUserModel(models: Record<string, any>) {
  const sq = getSequelize();
  const model = sq.define(
    'User',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      username: { type: DataTypes.STRING, allowNull: false, unique: true },
      password: { type: DataTypes.STRING, allowNull: false },
      real_name: { type: DataTypes.STRING, allowNull: false },
      student_id: { type: DataTypes.STRING, allowNull: false, unique: true },
      enrollment_year: { type: DataTypes.INTEGER, allowNull: false },
      major: { type: DataTypes.STRING, allowNull: false },
      status: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      weak_password_flag: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      email: { type: DataTypes.STRING, allowNull: true, unique: true },
      phone: { type: DataTypes.STRING, allowNull: true, unique: true },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'user',
      schema: 'public',
      timestamps: false,
      underscored: true,
    }
  );
  models.User = model as unknown as ModelDefined<User, UserInitializer>;
}
