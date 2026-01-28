import type { QueryInterface } from 'sequelize';
import { DataTypes } from 'sequelize';
import { getSequelize } from '../sequelize-client';
import { loadRootEnv } from '@csisp/utils';

loadRootEnv();

export async function up(): Promise<void> {
  const sequelize = getSequelize();
  const qi: QueryInterface = sequelize.getQueryInterface();

  await sequelize.transaction(async transaction => {
    await qi.createTable(
      'refresh_tokens',
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: DataTypes.INTEGER,
        },
        client_id: {
          type: DataTypes.STRING(128),
          allowNull: false,
        },
        sub_hash: {
          type: DataTypes.STRING(64),
          allowNull: false,
        },
        rt_hash: {
          type: DataTypes.STRING(64),
          allowNull: false,
          unique: true,
        },
        status: {
          type: DataTypes.STRING(16),
          allowNull: false,
          defaultValue: 'active', // active/rotated/revoked/compromised
        },
        prev_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        created_at: {
          allowNull: false,
          type: DataTypes.DATE,
          defaultValue: sequelize.fn('NOW'),
        },
        last_used_at: {
          allowNull: true,
          type: DataTypes.DATE,
        },
      },
      { transaction }
    );
    await qi.addIndex('refresh_tokens', ['client_id', 'status'], {
      name: 'refresh_tokens_client_status_idx',
      transaction,
    });
    await qi.addIndex('refresh_tokens', ['sub_hash'], {
      name: 'refresh_tokens_sub_idx',
      transaction,
    });
  });
}

export async function down(): Promise<void> {
  const sequelize = getSequelize();
  const qi: QueryInterface = sequelize.getQueryInterface();
  await sequelize.transaction(async transaction => {
    await qi.dropTable('refresh_tokens', { transaction });
  });
}
