'use strict';

const bcrypt = require('bcrypt');
const { TEACHERS, FIRST_NAMES, MALE_NAMES, FEMALE_NAMES } = require('./_lib/seed_data_sources.cjs');

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const [roleTeacher] = await queryInterface.sequelize.query(
      'SELECT id FROM role WHERE code = :c LIMIT 1',
      { replacements: { c: 'teacher' }, type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    for (let i = 0; i < TEACHERS.length; i++) {
      const teacher = TEACHERS[i];
      const username = `teacher${i + 1}`;
      const uExists = await queryInterface.sequelize.query(
        'SELECT id FROM "user" WHERE username = :u LIMIT 1',
        { replacements: { u: username }, type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      let userId;
      if (!uExists || uExists.length === 0) {
        const hashed = await bcrypt.hash('teacher123', 10);
        await queryInterface.bulkInsert('user', [
          {
            username,
            password: hashed,
            real_name: teacher.realName,
            student_id: String(Math.floor(10000000000 + Math.random() * 9000000000)),
            enrollment_year: 2023,
            major: '计算机科学',
            status: 1,
            email: `${username}@csisp.edu`,
            phone: `138${Math.floor(Math.random() * 100000000)
              .toString()
              .padStart(8, '0')}`,
            created_at: now,
            updated_at: now,
          },
        ]);
        const [created] = await queryInterface.sequelize.query(
          'SELECT id FROM "user" WHERE username = :u LIMIT 1',
          { replacements: { u: username }, type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        userId = created?.id;
      } else {
        userId = uExists[0].id;
      }

      const tExists = await queryInterface.sequelize.query(
        'SELECT id FROM teacher WHERE email = :email LIMIT 1',
        { replacements: { email: teacher.email }, type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      if (!tExists || tExists.length === 0) {
        await queryInterface.bulkInsert('teacher', [
          {
            user_id: userId || null,
            real_name: teacher.realName,
            email: teacher.email,
            department: teacher.department,
            title: getRandomElement(['讲师', '副教授', '教授']),
            status: 1,
            phone: `138${Math.floor(Math.random() * 100000000)
              .toString()
              .padStart(8, '0')}`,
            created_at: now,
            updated_at: now,
          },
        ]);
      }

      if (roleTeacher && userId) {
        const linkExists = await queryInterface.sequelize.query(
          'SELECT 1 FROM user_role WHERE user_id = :uid AND role_id = :rid LIMIT 1',
          {
            replacements: { uid: userId, rid: roleTeacher.id },
            type: queryInterface.sequelize.QueryTypes.SELECT,
          }
        );
        if (!linkExists || linkExists.length === 0) {
          await queryInterface.bulkInsert('user_role', [
            { user_id: userId, role_id: roleTeacher.id, created_at: now, updated_at: now },
          ]);
        }
      }
    }
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('teacher', null, {});
    for (let i = 0; i < TEACHERS.length; i++) {
      await queryInterface.bulkDelete('user', { username: `teacher${i + 1}` }, {});
    }
  },
};
