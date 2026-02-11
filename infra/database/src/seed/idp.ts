import { loadRootEnv } from '@csisp/utils';
import type MfaSettings from '@pgtype/MfaSettings';
import type User from '@pgtype/User';
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
    const UserModel = sequelize.define(
      'user',
      {
        id: { type: DataTypes.INTEGER, primaryKey: true },
        username: { type: DataTypes.STRING },
        phone: { type: DataTypes.STRING },
      },
      { tableName: 'user', timestamps: true, underscored: true }
    );
    const MfaSettingsModel = sequelize.define(
      'mfa_settings',
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        user_id: { type: DataTypes.INTEGER },
        otp_secret: { type: DataTypes.STRING },
        otp_enabled: { type: DataTypes.BOOLEAN },
      },
      { tableName: 'mfa_settings', timestamps: true, underscored: true }
    );
    const users = (await UserModel.findAll({
      attributes: ['id'],
      transaction,
      raw: true,
    })) as unknown as Array<Partial<User>>;
    logger.info({ users: users.length }, '读取用户列表');

    const adminRow = (await UserModel.findOne({
      where: { username: ADMIN_USER_SEED.username },
      attributes: ['id'],
      transaction,
      raw: true,
    })) as unknown as Partial<User> | null;
    const adminUserId: number | undefined = adminRow?.id;

    const existing = (await MfaSettingsModel.findAll({
      attributes: ['user_id'],
      transaction,
      raw: true,
    })) as unknown as Array<Partial<MfaSettings>>;
    const existingSet = new Set(existing.map(e => e.user_id));
    logger.info({ existing: existing.length }, '已存在 mfa_settings 记录数');

    const rows = users
      .filter(u => u.id && !existingSet.has(u.id))
      .map(u => ({
        user_id: u.id,
        otp_secret: 'placeholder-secret-' + u.id,
        otp_enabled: false,
        sms_enabled: false,
        email_enabled: false,
        fido2_enabled: false,
        required: false,
        created_at: new Date(),
        updated_at: new Date(),
      }));

    if (rows.length > 0) {
      await qi.bulkInsert('mfa_settings', rows, { transaction });
      logger.info({ inserted: rows.length }, '插入默认 mfa_settings 成功');
    } else {
      logger.info('无需插入，所有用户已存在 mfa_settings');
    }
  });

  await closeSequelize();
  logger.info({ step: 'seed-idp' }, '默认 mfa_settings 生成完成');
}
