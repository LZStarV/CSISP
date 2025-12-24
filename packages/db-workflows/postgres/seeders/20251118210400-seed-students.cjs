'use strict';

const bcrypt = require('bcrypt');
const { FIRST_NAMES, MALE_NAMES, FEMALE_NAMES, MAJORS } = require('./_lib/seed_data_sources.cjs');

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function getRandomSubarray(arr, size) {
  if (size >= arr.length) return arr;
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
}
function generateChineseName() {
  const familyName = getRandomElement(FIRST_NAMES);
  const isMale = Math.random() > 0.5;
  const givenNameLength = Math.random() > 0.3 ? 2 : 1;
  let givenName = '';
  if (givenNameLength === 1) {
    givenName = isMale ? getRandomElement(MALE_NAMES) : getRandomElement(FEMALE_NAMES);
  } else {
    givenName = isMale
      ? getRandomElement(MALE_NAMES) + getRandomElement(MALE_NAMES)
      : getRandomElement(FEMALE_NAMES) + getRandomElement(FEMALE_NAMES);
  }
  return familyName + givenName;
}

const MAJOR_CODES = {
  计算机科学与技术: '2131',
  '计算机科学与技术（师范）': '2121',
  网络工程: '2132',
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const [roleStudent] = await queryInterface.sequelize.query(
      'SELECT id FROM role WHERE code = :c LIMIT 1',
      { replacements: { c: 'student' }, type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const enrollmentYears = [2022, 2023, 2024, 2025];
    const distributionPerYear = [
      { major: '计算机科学与技术', count: 120 },
      { major: '计算机科学与技术（师范）', count: 40 },
      { major: '网络工程', count: 40 },
    ];

    for (const year of enrollmentYears) {
      for (const { major, count } of distributionPerYear) {
        const majorCode = MAJOR_CODES[major];
        for (let i = 1; i <= count; i++) {
          const sequenceNumber = String(i).padStart(3, '0');
          const studentId = `${year}${majorCode}${sequenceNumber}`;
          const realName = generateChineseName();
          const username = `student${year}${major.slice(0, 2)}${sequenceNumber}`;

          const exists = await queryInterface.sequelize.query(
            'SELECT id FROM "user" WHERE username = :u OR student_id = :sid LIMIT 1',
            {
              replacements: { u: username, sid: studentId },
              type: queryInterface.sequelize.QueryTypes.SELECT,
            }
          );
          let userId;
          if (!exists || exists.length === 0) {
            const hashed = await bcrypt.hash('student123', 10);
            await queryInterface.bulkInsert('user', [
              {
                username,
                password: hashed,
                real_name: realName,
                student_id: studentId,
                enrollment_year: year,
                major,
                status: 1,
                email: `${username}@example.com`,
                phone: `137${Math.floor(Math.random() * 100000000)
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
            userId = exists[0].id;
          }

          if (roleStudent && userId) {
            const linkExists = await queryInterface.sequelize.query(
              'SELECT 1 FROM user_role WHERE user_id = :uid AND role_id = :rid LIMIT 1',
              {
                replacements: { uid: userId, rid: roleStudent.id },
                type: queryInterface.sequelize.QueryTypes.SELECT,
              }
            );
            if (!linkExists || linkExists.length === 0) {
              await queryInterface.bulkInsert('user_role', [
                { user_id: userId, role_id: roleStudent.id, created_at: now, updated_at: now },
              ]);
            }
          }
        }
      }
    }
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('user_role', null, {});
    await queryInterface.bulkDelete('user', null, {});
  },
};
