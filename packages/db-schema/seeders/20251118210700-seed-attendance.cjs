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
    const classes = await queryInterface.sequelize.query('SELECT id FROM class', {
      type: queryInterface.sequelize.QueryTypes.SELECT,
    });
    const taskCount = 100;
    for (let i = 0; i < taskCount; i++) {
      const cls = getRandomElement(classes);
      const startTime = new Date();
      startTime.setDate(startTime.getDate() - getRandomInt(0, 90));
      startTime.setHours(getRandomInt(8, 17));
      startTime.setMinutes(0);
      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 2);

      await queryInterface.bulkInsert('attendance_task', [
        {
          course_id: (
            await queryInterface.sequelize.query('SELECT course_id FROM class WHERE id = :cid', {
              replacements: { cid: cls.id },
              type: queryInterface.sequelize.QueryTypes.SELECT,
            })
          )[0].course_id,
          start_time: startTime,
          end_time: endTime,
          status: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      const [taskRow] = await queryInterface.sequelize.query(
        'SELECT id FROM attendance_task ORDER BY id DESC LIMIT 1',
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      const uc = await queryInterface.sequelize.query(
        'SELECT user_id FROM user_class WHERE class_id = :cid',
        { replacements: { cid: cls.id }, type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      if (uc.length === 0) continue;
      const presentCount = Math.max(1, Math.floor(uc.length * 0.8));
      const present = getRandomSubarray(uc, presentCount);
      for (const s of present) {
        await queryInterface.bulkInsert('attendance_record', [
          {
            task_id: taskRow.id,
            user_id: s.user_id,
            checkin_time: startTime,
            status: getRandomElement(['present', 'late', 'absent']),
            device_info: getRandomElement(['iOS', 'Android', 'Web']),
            created_at: new Date(),
            updated_at: new Date(),
          },
        ]);
      }
    }
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('attendance_record', null, {});
    await queryInterface.bulkDelete('attendance_task', null, {});
  },
};
