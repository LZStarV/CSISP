import { QueryTypes } from 'sequelize';
import bcrypt from 'bcrypt';
import { getSequelize } from '../sequelize-client';

export async function up(): Promise<void> {
  const sequelize = getSequelize();
  const queryInterface = sequelize.getQueryInterface();
  const now = new Date();

  const roles = [
    { name: 'admin', code: 'admin', description: '管理员' },
    { name: 'student', code: 'student', description: '学生' },
    { name: 'teacher', code: 'teacher', description: '教师' },
  ];

  for (const role of roles) {
    const existingRoles = (await sequelize.query('SELECT id FROM role WHERE code = :code LIMIT 1', {
      replacements: { code: role.code },
      type: QueryTypes.SELECT,
    })) as Array<{ id: number }>;

    if (!existingRoles.length) {
      await queryInterface.bulkInsert('role', [
        {
          name: role.name,
          code: role.code,
          description: role.description,
          status: 1,
          created_at: now,
          updated_at: now,
        },
      ]);
    }
  }

  const adminRoleRows = (await sequelize.query('SELECT id FROM role WHERE code = :code LIMIT 1', {
    replacements: { code: 'admin' },
    type: QueryTypes.SELECT,
  })) as Array<{ id: number }>;
  const adminRoleId = adminRoleRows.length ? adminRoleRows[0].id : null;

  const adminUsername = 'admin';
  const adminUserRows = (await sequelize.query(
    'SELECT id FROM "user" WHERE username = :username LIMIT 1',
    {
      replacements: { username: adminUsername },
      type: QueryTypes.SELECT,
    }
  )) as Array<{ id: number }>;

  let userId: number | null = adminUserRows.length ? adminUserRows[0].id : null;

  if (!userId) {
    const hashed = await bcrypt.hash('admin123', 10);
    await queryInterface.bulkInsert('user', [
      {
        username: adminUsername,
        password: hashed,
        real_name: '系统管理员',
        student_id: '20232131082',
        enrollment_year: 2023,
        major: '计算机科学与技术',
        status: 1,
        email: 'admin@csisp.edu',
        phone: '13800000000',
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
  }

  if (adminRoleId && userId) {
    const linkRows = (await sequelize.query(
      'SELECT 1 FROM user_role WHERE user_id = :uid AND role_id = :rid LIMIT 1',
      {
        replacements: { uid: userId, rid: adminRoleId },
        type: QueryTypes.SELECT,
      }
    )) as Array<unknown>;

    if (!linkRows.length) {
      await queryInterface.bulkInsert('user_role', [
        {
          user_id: userId,
          role_id: adminRoleId,
          created_at: now,
          updated_at: now,
        },
      ]);
    }
  }
}

export async function down(): Promise<void> {
  const sequelize = getSequelize();
  const queryInterface = sequelize.getQueryInterface();
  const adminUsername = 'admin';

  const adminUserRows = (await sequelize.query(
    'SELECT id FROM "user" WHERE username = :username LIMIT 1',
    {
      replacements: { username: adminUsername },
      type: QueryTypes.SELECT,
    }
  )) as Array<{ id: number }>;

  if (adminUserRows.length) {
    const adminUserId = adminUserRows[0].id;
    await queryInterface.bulkDelete('user_role', { user_id: adminUserId }, {});
    await queryInterface.bulkDelete('user', { username: adminUsername }, {});
  }

  await queryInterface.bulkDelete('role', { code: ['admin', 'student', 'teacher'] }, {});
}
