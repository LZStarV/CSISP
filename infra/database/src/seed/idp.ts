import { loadRootEnv } from '@csisp/utils';
import { DataTypes, type QueryInterface } from 'sequelize';

import { getInfraDbLogger } from '../logger';
import { getSequelize, closeSequelize } from '../sequelize-client';

import { ADMIN_USER_SEED } from './config';

loadRootEnv();
const logger = getInfraDbLogger();

export async function seedIdp(): Promise<void> {
  const sequelize = getSequelize();
  const qi: QueryInterface = sequelize.getQueryInterface();
  logger.info({ step: 'seed-idp' }, '开始为用户生成默认 mfa_settings');

  await sequelize.transaction(async transaction => {
    const User = sequelize.define(
      'user',
      {
        id: { type: DataTypes.INTEGER, primaryKey: true },
        username: { type: DataTypes.STRING },
        phone: { type: DataTypes.STRING },
      },
      { tableName: 'user', timestamps: true, underscored: true }
    );
    const MfaSettings = sequelize.define(
      'mfa_settings',
      {
        user_id: { type: DataTypes.INTEGER, primaryKey: true },
        required: { type: DataTypes.BOOLEAN },
      },
      { tableName: 'mfa_settings', timestamps: true, underscored: true }
    );
    const users = (await User.findAll({
      attributes: ['id', 'phone'],
      transaction,
      raw: true,
    })) as unknown as Array<{ id: number; phone?: string | null }>;
    logger.info({ users: users.length }, '读取用户列表');

    const adminRow = (await User.findOne({
      where: { username: ADMIN_USER_SEED.username },
      attributes: ['id'],
      transaction,
      raw: true,
    })) as unknown as { id: number } | null;
    const adminUserId: number | undefined = adminRow?.id;

    const existing = (await MfaSettings.findAll({
      attributes: ['user_id'],
      transaction,
      raw: true,
    })) as unknown as Array<{ user_id: number }>;
    const existingSet = new Set(existing.map(e => e.user_id));
    logger.info({ existing: existing.length }, '已存在 mfa_settings 记录数');

    const rows = users
      .filter(u => !existingSet.has(u.id))
      .map(u => ({
        user_id: u.id,
        sms_enabled: true,
        email_enabled: false,
        fido2_enabled: false,
        otp_enabled: false,
        phone_number: u.phone ?? null,
        required: adminUserId && u.id === adminUserId ? false : true,
        created_at: new Date(),
        updated_at: new Date(),
      }));

    if (rows.length > 0) {
      await qi.bulkInsert('mfa_settings', rows, { transaction });
      logger.info({ inserted: rows.length }, '插入默认 mfa_settings 成功');
    } else {
      logger.info('无需插入，所有用户已存在 mfa_settings');
    }

    if (adminUserId && existingSet.has(adminUserId)) {
      await MfaSettings.update(
        { required: false },
        { where: { user_id: adminUserId }, transaction }
      );
      logger.info({ adminUserId }, '更新 admin 用户的 mfa_settings 为豁免');
    }
  });

  await closeSequelize();
  logger.info({ step: 'seed-idp' }, '默认 mfa_settings 生成完成');
}
