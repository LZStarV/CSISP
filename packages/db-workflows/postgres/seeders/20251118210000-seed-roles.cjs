'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const roles = [
      { name: 'admin', code: 'admin', description: '管理员', created_at: now, updated_at: now },
      { name: 'student', code: 'student', description: '学生', created_at: now, updated_at: now },
      { name: 'teacher', code: 'teacher', description: '教师', created_at: now, updated_at: now },
    ];
    for (const r of roles) {
      const exists = await queryInterface.sequelize.query(
        'SELECT id FROM role WHERE code = :code LIMIT 1',
        { replacements: { code: r.code }, type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      if (!exists || exists.length === 0) {
        await queryInterface.bulkInsert('role', [r]);
      }
    }
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('role', null, {});
  },
};
