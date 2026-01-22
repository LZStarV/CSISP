import { DataTypes, type ModelDefined } from 'sequelize';

import { getSequelize } from '../client';

import type User from '@/src/infra/postgres/generated/public/User';
import type { UserInitializer } from '@/src/infra/postgres/generated/public/User';

export function defineUserModel(models: Record<string, any>) {
  const sq = getSequelize();
  const model = sq.define(
    'User',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true },
      username: { type: DataTypes.STRING, allowNull: false },
      password: { type: DataTypes.STRING, allowNull: false },
      real_name: { type: DataTypes.STRING, allowNull: false },
      student_id: { type: DataTypes.STRING, allowNull: false },
      enrollment_year: { type: DataTypes.INTEGER, allowNull: false },
      major: { type: DataTypes.STRING, allowNull: false },
      status: { type: DataTypes.INTEGER, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: true },
      phone: { type: DataTypes.STRING, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
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
