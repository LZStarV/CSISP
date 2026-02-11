import { loadRootEnv } from '@csisp/utils';
import { QueryTypes } from 'sequelize';

import { getInfraDbLogger } from '../logger';
import { getSequelize, closeSequelize } from '../sequelize-client';

import { ADMIN_USER_SEED, BASE_ROLES } from './config';

loadRootEnv();
const logger = getInfraDbLogger();

export async function seedBaseData(): Promise<void> {
  const sequelize = getSequelize();
  const qi = sequelize.getQueryInterface();
  const now = new Date();

  logger.info('开始写入基础角色');
  for (const role of BASE_ROLES) {
    const existingRoles = (await sequelize.query(
      'SELECT id FROM role WHERE code = :code LIMIT 1',
      {
        replacements: { code: role.code },
        type: QueryTypes.SELECT,
      }
    )) as Array<{ id: number }>;
    if (!existingRoles.length) {
      await qi.bulkInsert('role', [
        {
          name: role.name,
          code: role.code,
          description: role.description,
          status: 1,
          created_at: now,
          updated_at: now,
        },
      ]);
      logger.info({ role: role.code }, '插入角色成功');
    }
  }

  logger.info('检查并创建 admin 用户');
  const adminUsername = ADMIN_USER_SEED.username;
  const adminUserRows = (await sequelize.query(
    'SELECT id FROM "user" WHERE username = :username LIMIT 1',
    {
      replacements: { username: adminUsername },
      type: QueryTypes.SELECT,
    }
  )) as Array<{ id: number }>;
  let userId: number | null = adminUserRows.length ? adminUserRows[0].id : null;

  if (!userId) {
    await qi.bulkInsert('user', [
      {
        username: ADMIN_USER_SEED.username,
        password: ADMIN_USER_SEED.password,
        real_name: ADMIN_USER_SEED.real_name,
        student_id: ADMIN_USER_SEED.student_id,
        enrollment_year: ADMIN_USER_SEED.enrollment_year,
        major: ADMIN_USER_SEED.major,
        status: 1,
        email: ADMIN_USER_SEED.email,
        phone: ADMIN_USER_SEED.phone,
        roles: JSON.stringify(['admin']),
        created_at: now,
        updated_at: now,
      },
    ]);
    const createdRows = (await sequelize.query(
      'SELECT id FROM "user" WHERE username = :username LIMIT 1',
      {
        replacements: { username: adminUsername },
        type: QueryTypes.SELECT,
      }
    )) as Array<{ id: number }>;
    userId = createdRows.length ? createdRows[0].id : null;
    logger.info({ userId }, '创建 admin 用户成功');
  } else {
    // 确保已存在的 admin 用户也有 roles 字段
    await sequelize.query(
      'UPDATE "user" SET roles = :roles WHERE id = :userId AND (roles IS NULL OR roles = \'[]\'::jsonb)',
      {
        replacements: { userId, roles: JSON.stringify(['admin']) },
        type: QueryTypes.UPDATE,
      }
    );
  }

  const adminRoleRows = (await sequelize.query(
    'SELECT id FROM role WHERE code = :code LIMIT 1',
    {
      replacements: { code: 'admin' },
      type: QueryTypes.SELECT,
    }
  )) as Array<{ id: number }>;
  const adminRoleId = adminRoleRows.length ? adminRoleRows[0].id : null;

  if (adminRoleId && userId) {
    const linkRows = (await sequelize.query(
      'SELECT 1 FROM user_role WHERE user_id = :uid AND role_id = :rid LIMIT 1',
      {
        replacements: { uid: userId, rid: adminRoleId },
        type: QueryTypes.SELECT,
      }
    )) as Array<unknown>;
    if (!linkRows.length) {
      await qi.bulkInsert('user_role', [
        {
          user_id: userId,
          role_id: adminRoleId,
          created_at: now,
          updated_at: now,
        },
      ]);
      logger.info('绑定 admin 用户角色成功');
    }
  }

  await closeSequelize();
  logger.info('基础角色与 admin 用户种子完成');
}
