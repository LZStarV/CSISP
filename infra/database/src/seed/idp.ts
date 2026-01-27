import { loadRootEnv } from '@csisp/utils';
import type { QueryInterface } from 'sequelize';

import { getInfraDbLogger } from '../logger';
import { getSequelize, closeSequelize } from '../sequelize-client';

loadRootEnv();
const logger = getInfraDbLogger();

export async function seedIdp(): Promise<void> {
  const sequelize = getSequelize();
  const qi: QueryInterface = sequelize.getQueryInterface();
  logger.info({ step: 'seed-idp' }, '开始为用户生成默认 mfa_settings');

  await sequelize.transaction(async transaction => {
    const users: Array<{ id: number; phone?: string | null }> =
      (await sequelize.query('SELECT id, phone FROM "user";', {
        type: 'SELECT',
        transaction,
      })) as any;
    logger.info({ users: users.length }, '读取用户列表');

    const existing: Array<{ user_id: number }> = (await sequelize.query(
      'SELECT user_id FROM "mfa_settings";',
      { type: 'SELECT', transaction }
    )) as any;
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
        required: true,
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
