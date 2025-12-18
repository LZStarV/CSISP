'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async t => {
      await queryInterface.createTable(
        'user',
        {
          id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
          username: { type: Sequelize.STRING(255), allowNull: false, unique: true },
          password: { type: Sequelize.STRING(255), allowNull: false },
          real_name: { type: Sequelize.STRING(255), allowNull: false },
          student_id: { type: Sequelize.STRING(11), allowNull: false, unique: true },
          enrollment_year: { type: Sequelize.INTEGER, allowNull: false },
          major: { type: Sequelize.STRING(100), allowNull: false },
          status: { type: Sequelize.INTEGER, defaultValue: 1 },
          email: { type: Sequelize.STRING(255), allowNull: true, unique: true },
          phone: { type: Sequelize.STRING(20), allowNull: true, unique: true },
          created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
          updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction: t }
      );

      await queryInterface.createTable(
        'role',
        {
          id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
          name: { type: Sequelize.STRING(50), allowNull: false, unique: true },
          code: { type: Sequelize.STRING(50), allowNull: false, unique: true },
          description: { type: Sequelize.TEXT, allowNull: true },
          created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
          updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction: t }
      );

      await queryInterface.createTable(
        'teacher',
        {
          id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
          user_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'user', key: 'id' },
            onDelete: 'SET NULL',
          },
          real_name: { type: Sequelize.STRING(255), allowNull: false },
          email: { type: Sequelize.STRING(255), allowNull: false, unique: true },
          phone: { type: Sequelize.STRING(20), allowNull: false, unique: true },
          department: { type: Sequelize.STRING(255), allowNull: false },
          title: { type: Sequelize.STRING(100), allowNull: true },
          status: { type: Sequelize.INTEGER, defaultValue: 1 },
          created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
          updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction: t }
      );

      await queryInterface.createTable(
        'course',
        {
          id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
          course_name: { type: Sequelize.STRING(255), allowNull: false },
          course_code: { type: Sequelize.STRING(50), allowNull: false },
          semester: { type: Sequelize.INTEGER, allowNull: false },
          academic_year: { type: Sequelize.INTEGER, allowNull: false },
          available_majors: { type: Sequelize.JSON, allowNull: true },
          status: { type: Sequelize.INTEGER, defaultValue: 1 },
          created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
          updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction: t }
      );
      await queryInterface.addConstraint('course', {
        fields: ['course_code', 'semester', 'academic_year'],
        type: 'unique',
        name: 'course_code_semester_year_unique',
        transaction: t,
      });

      await queryInterface.createTable(
        'class',
        {
          id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
          class_name: { type: Sequelize.STRING(255), allowNull: false },
          course_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'course', key: 'id' },
            onDelete: 'CASCADE',
          },
          teacher_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'teacher', key: 'id' },
            onDelete: 'CASCADE',
          },
          semester: { type: Sequelize.INTEGER, allowNull: false },
          academic_year: { type: Sequelize.INTEGER, allowNull: false },
          max_students: { type: Sequelize.INTEGER, defaultValue: 50 },
          status: { type: Sequelize.INTEGER, defaultValue: 1 },
          created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
          updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction: t }
      );
      await queryInterface.addConstraint('class', {
        fields: ['course_id', 'class_name'],
        type: 'unique',
        name: 'class_course_class_name_unique',
        transaction: t,
      });

      await queryInterface.createTable(
        'user_role',
        {
          user_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'user', key: 'id' },
            onDelete: 'CASCADE',
          },
          role_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'role', key: 'id' },
            onDelete: 'CASCADE',
          },
          created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
          updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction: t }
      );
      await queryInterface.addConstraint('user_role', {
        fields: ['user_id', 'role_id'],
        type: 'primary key',
        name: 'user_role_pk',
        transaction: t,
      });

      await queryInterface.createTable(
        'course_teacher',
        {
          course_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'course', key: 'id' },
            onDelete: 'CASCADE',
          },
          teacher_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'teacher', key: 'id' },
            onDelete: 'CASCADE',
          },
          created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
          updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction: t }
      );
      await queryInterface.addConstraint('course_teacher', {
        fields: ['course_id', 'teacher_id'],
        type: 'primary key',
        name: 'course_teacher_pk',
        transaction: t,
      });

      await queryInterface.createTable(
        'user_class',
        {
          id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
          user_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'user', key: 'id' },
            onDelete: 'CASCADE',
          },
          class_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'class', key: 'id' },
            onDelete: 'CASCADE',
          },
          join_time: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
          status: { type: Sequelize.INTEGER, defaultValue: 1 },
          created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
          updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction: t }
      );
      await queryInterface.addConstraint('user_class', {
        fields: ['user_id', 'class_id'],
        type: 'unique',
        name: 'user_class_unique',
        transaction: t,
      });

      await queryInterface.createTable(
        'time_slot',
        {
          id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
          course_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'course', key: 'id' },
            onDelete: 'CASCADE',
          },
          week_day: { type: Sequelize.INTEGER, allowNull: false },
          start_time: { type: Sequelize.STRING(10), allowNull: false },
          end_time: { type: Sequelize.STRING(10), allowNull: false },
          location: { type: Sequelize.STRING(255), allowNull: true },
          created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
          updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction: t }
      );

      await queryInterface.createTable(
        'attendance_task',
        {
          id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
          course_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'course', key: 'id' },
            onDelete: 'CASCADE',
          },
          start_time: { type: Sequelize.DATE, allowNull: false },
          end_time: { type: Sequelize.DATE, allowNull: false },
          status: { type: Sequelize.INTEGER, defaultValue: 1 },
          created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
          updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction: t }
      );

      await queryInterface.createTable(
        'attendance_record',
        {
          id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
          task_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'attendance_task', key: 'id' },
            onDelete: 'CASCADE',
          },
          user_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'user', key: 'id' },
            onDelete: 'CASCADE',
          },
          checkin_time: { type: Sequelize.DATE, allowNull: false },
          status: { type: Sequelize.STRING(50), allowNull: false, defaultValue: 'present' },
          ip_address: { type: Sequelize.STRING(50), allowNull: true },
          device_info: { type: Sequelize.TEXT, allowNull: true },
          created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
          updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction: t }
      );
      await queryInterface.addConstraint('attendance_record', {
        fields: ['task_id', 'user_id'],
        type: 'unique',
        name: 'attendance_record_task_user_unique',
        transaction: t,
      });

      console.log('✅ 所有数据表创建成功');
    });
  },

  async down(queryInterface) {
    return queryInterface.sequelize.transaction(async t => {
      await queryInterface.dropTable('attendance_record', { transaction: t });
      await queryInterface.dropTable('attendance_task', { transaction: t });
      await queryInterface.dropTable('time_slot', { transaction: t });
      await queryInterface.dropTable('user_class', { transaction: t });
      await queryInterface.dropTable('course_teacher', { transaction: t });
      await queryInterface.dropTable('user_role', { transaction: t });
      await queryInterface.dropTable('class', { transaction: t });
      await queryInterface.dropTable('course', { transaction: t });
      await queryInterface.dropTable('teacher', { transaction: t });
      await queryInterface.dropTable('role', { transaction: t });
      await queryInterface.dropTable('user', { transaction: t });
      console.log('✅ 所有数据表删除成功');
    });
  },
};
