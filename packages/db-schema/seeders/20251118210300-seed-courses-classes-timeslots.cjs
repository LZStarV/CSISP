'use strict';

const { COURSE_DATA } = require('./_lib/seed_data_sources.cjs');

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const coursesData = COURSE_DATA.slice(0, Math.max(100, COURSE_DATA.length));

    for (const courseData of coursesData) {
      const semesterStr = courseData.semester;
      const sem = Number(String(semesterStr).split('-')[1] || courseData.semester);
      const currentYear = new Date().getFullYear();
      let academicYear = currentYear;
      if (sem === 3 || sem === 4) academicYear = currentYear - 1;
      else if (sem === 5 || sem === 6) academicYear = currentYear - 2;
      else if (sem === 7 || sem === 8) academicYear = currentYear - 3;

      const exists = await queryInterface.sequelize.query(
        'SELECT id FROM course WHERE course_code = :code AND semester = :sem AND academic_year = :ay LIMIT 1',
        {
          replacements: { code: courseData.code, sem: sem, ay: academicYear },
          type: queryInterface.sequelize.QueryTypes.SELECT,
        }
      );
      if (!exists || exists.length === 0) {
        await queryInterface.bulkInsert('course', [
          {
            course_name: courseData.name,
            course_code: courseData.code,
            semester: sem,
            academic_year: courseData.academicYear || academicYear,
            available_majors: JSON.stringify(courseData.availableMajors || []),
            status: 1,
            created_at: now,
            updated_at: now,
          },
        ]);
      }

      const [courseRow] = await queryInterface.sequelize.query(
        'SELECT id, course_name, semester, academic_year FROM course WHERE course_code = :code LIMIT 1',
        {
          replacements: { code: courseData.code },
          type: queryInterface.sequelize.QueryTypes.SELECT,
        }
      );

      const [teacherRow] = await queryInterface.sequelize.query(
        'SELECT id FROM teacher ORDER BY RANDOM() LIMIT 1',
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      if (courseRow && teacherRow) {
        const ctExists = await queryInterface.sequelize.query(
          'SELECT 1 FROM course_teacher WHERE course_id = :cid AND teacher_id = :tid LIMIT 1',
          {
            replacements: { cid: courseRow.id, tid: teacherRow.id },
            type: queryInterface.sequelize.QueryTypes.SELECT,
          }
        );
        if (!ctExists || ctExists.length === 0) {
          await queryInterface.bulkInsert('course_teacher', [
            {
              course_id: courseRow.id,
              teacher_id: teacherRow.id,
              created_at: now,
              updated_at: now,
            },
          ]);
        }

        const className = `${courseRow.course_name}-${getRandomInt(1, 5)}班`;
        const clExists = await queryInterface.sequelize.query(
          'SELECT id FROM class WHERE course_id = :cid AND class_name = :cn LIMIT 1',
          {
            replacements: { cid: courseRow.id, cn: className },
            type: queryInterface.sequelize.QueryTypes.SELECT,
          }
        );
        if (!clExists || clExists.length === 0) {
          await queryInterface.bulkInsert('class', [
            {
              class_name: className,
              course_id: courseRow.id,
              teacher_id: teacherRow.id,
              semester: courseRow.semester,
              academic_year: courseRow.academic_year,
              max_students: getRandomInt(30, 60),
              status: 1,
              created_at: now,
              updated_at: now,
            },
          ]);
        }

        const [classRow] = await queryInterface.sequelize.query(
          'SELECT id FROM class WHERE course_id = :cid AND class_name = :cn LIMIT 1',
          {
            replacements: { cid: courseRow.id, cn: className },
            type: queryInterface.sequelize.QueryTypes.SELECT,
          }
        );

        const weekDays = [1, 2, 3, 4, 5];
        const startTimes = ['08:00', '09:50', '14:00', '15:50', '19:00'];
        const endTimes = ['09:40', '11:30', '15:40', '17:30', '20:40'];
        const locations = ['A101', 'A102', 'B201', 'B202', 'C301', 'C302'];
        const weekDay = getRandomElement(weekDays);
        const timeIndex = getRandomInt(0, 4);

        const tsExists = await queryInterface.sequelize.query(
          'SELECT id FROM time_slot WHERE course_id = :cid AND week_day = :wd AND start_time = :st LIMIT 1',
          {
            replacements: { cid: courseRow.id, wd: weekDay, st: startTimes[timeIndex] },
            type: queryInterface.sequelize.QueryTypes.SELECT,
          }
        );
        if (!tsExists || tsExists.length === 0) {
          await queryInterface.bulkInsert('time_slot', [
            {
              course_id: courseRow.id,
              week_day: weekDay,
              start_time: startTimes[timeIndex],
              end_time: endTimes[timeIndex],
              location: getRandomElement(locations),
              created_at: now,
              updated_at: now,
            },
          ]);
        }
      }
    }
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('time_slot', null, {});
    await queryInterface.bulkDelete('class', null, {});
    await queryInterface.bulkDelete('course_teacher', null, {});
    await queryInterface.bulkDelete('course', null, {});
  },
};
