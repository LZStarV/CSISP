'use strict';

const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const [roleAdmin] = await queryInterface.sequelize.query(
      'SELECT id FROM role WHERE code = :c LIMIT 1',
      { replacements: { c: 'admin' }, type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const username = 'admin';
    const exists = await queryInterface.sequelize.query(
      'SELECT id FROM "user" WHERE username = :u LIMIT 1',
      { replacements: { u: username }, type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    if (!exists || exists.length === 0) {
      const hashed = await bcrypt.hash('admin123', 10);
      await queryInterface.bulkInsert('user', [
        {
          username,
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
    }

    const [adminUser] = await queryInterface.sequelize.query(
      'SELECT id FROM "user" WHERE username = :u LIMIT 1',
      { replacements: { u: username }, type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    if (roleAdmin && adminUser) {
      const linkExists = await queryInterface.sequelize.query(
        'SELECT 1 FROM user_role WHERE user_id = :uid AND role_id = :rid LIMIT 1',
        {
          replacements: { uid: adminUser.id, rid: roleAdmin.id },
          type: queryInterface.sequelize.QueryTypes.SELECT,
        }
      );
      if (!linkExists || linkExists.length === 0) {
        await queryInterface.bulkInsert('user_role', [
          { user_id: adminUser.id, role_id: roleAdmin.id, created_at: now, updated_at: now },
        ]);
      }
    }
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('user_role', {}, {});
    await queryInterface.bulkDelete('user', { username: 'admin' }, {});
  },
};
