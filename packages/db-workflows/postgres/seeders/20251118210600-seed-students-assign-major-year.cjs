'use strict';

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getRandomSubarray(arr, size) {
  if (size >= arr.length) return arr;
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const classes = await queryInterface.sequelize.query('SELECT id, course_id FROM class', {
      type: queryInterface.sequelize.QueryTypes.SELECT,
    });
    const courses = await queryInterface.sequelize.query(
      'SELECT id, available_majors, semester, academic_year FROM course',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    for (const cls of classes) {
      const course = courses.find(c => c.id === cls.course_id);
      if (!course) continue;
      const majors = Array.isArray(course.available_majors)
        ? course.available_majors
        : JSON.parse(course.available_majors || '[]');
      const currentYear = new Date().getFullYear();

      const eligible = await queryInterface.sequelize.query(
        'SELECT id, major, enrollment_year FROM "user" WHERE username LIKE :prefix',
        { replacements: { prefix: 'student%' }, type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      const filtered = eligible.filter(student => {
        if (!majors || majors.length === 0) return true;
        const majorOk = majors.includes(student.major);
        const yearOk =
          (student.enrollment_year === currentYear &&
            (course.semester === 1 || course.semester === 2)) ||
          (student.enrollment_year === currentYear - 1 &&
            (course.semester === 3 || course.semester === 4)) ||
          (student.enrollment_year === currentYear - 2 &&
            (course.semester === 5 || course.semester === 6)) ||
          (student.enrollment_year === currentYear - 3 &&
            (course.semester === 7 || course.semester === 8));
        return majorOk && yearOk;
      });

      const selected = getRandomSubarray(filtered, getRandomInt(10, 30));
      for (const stu of selected) {
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
              join_time: new Date(),
              status: 1,
              created_at: new Date(),
              updated_at: new Date(),
            },
          ]);
        }
      }
    }
  },
  async down(queryInterface) {
    // 不做回滚，保持班级分配
  },
};
