'use strict';

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

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const classes = await queryInterface.sequelize.query('SELECT id, course_id FROM class', {
      type: queryInterface.sequelize.QueryTypes.SELECT,
    });
    const users = await queryInterface.sequelize.query(
      'SELECT id FROM "user" WHERE username LIKE :prefix',
      { replacements: { prefix: 'student%' }, type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    for (const cls of classes) {
      const selectedStudents = getRandomSubarray(users, getRandomInt(10, 30));
      for (const stu of selectedStudents) {
        const exists = await queryInterface.sequelize.query(
          'SELECT 1 FROM user_class WHERE user_id = :uid AND class_id = :cid LIMIT 1',
          {
            replacements: { uid: stu.id, cid: cls.id },
            type: queryInterface.sequelize.QueryTypes.SELECT,
          }
        );
        if (!exists || exists.length === 0) {
          await queryInterface.bulkInsert('user_class', [
            {
              user_id: stu.id,
              class_id: cls.id,
              join_time: now,
              status: 1,
              created_at: now,
              updated_at: now,
            },
          ]);
        }
      }
    }
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('user_class', null, {});
  },
};
