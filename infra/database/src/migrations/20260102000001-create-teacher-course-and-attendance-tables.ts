import type { QueryInterface } from 'sequelize';
import { DataTypes } from 'sequelize';
import { getSequelize } from '../sequelize-client';
import { loadRootEnv } from '@csisp/utils';

loadRootEnv();
export async function up(): Promise<void> {
  const sequelize = getSequelize();
  const queryInterface: QueryInterface = sequelize.getQueryInterface();

  await sequelize.transaction(async transaction => {
    await queryInterface.createTable(
      'teacher',
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: DataTypes.INTEGER,
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: {
            model: 'user',
            key: 'id',
          },
          onDelete: 'SET NULL',
        },
        real_name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: true,
        },
        phone: {
          type: DataTypes.STRING(20),
          allowNull: false,
          unique: true,
        },
        department: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        title: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        status: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
        },
        created_at: {
          allowNull: false,
          type: DataTypes.DATE,
          defaultValue: sequelize.fn('NOW'),
        },
        updated_at: {
          allowNull: false,
          type: DataTypes.DATE,
          defaultValue: sequelize.fn('NOW'),
        },
      },
      { transaction }
    );

    await queryInterface.createTable(
      'course',
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: DataTypes.INTEGER,
        },
        course_name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        course_code: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        semester: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        academic_year: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        available_majors: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        status: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
        },
        created_at: {
          allowNull: false,
          type: DataTypes.DATE,
          defaultValue: sequelize.fn('NOW'),
        },
        updated_at: {
          allowNull: false,
          type: DataTypes.DATE,
          defaultValue: sequelize.fn('NOW'),
        },
      },
      { transaction }
    );

    await queryInterface.addConstraint('course', {
      fields: ['course_code', 'semester', 'academic_year'],
      type: 'unique',
      transaction,
    });

    await queryInterface.createTable(
      'class',
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: DataTypes.INTEGER,
        },
        class_name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        course_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'course',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        teacher_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'teacher',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        semester: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        academic_year: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        max_students: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 50,
        },
        status: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
        },
        created_at: {
          allowNull: false,
          type: DataTypes.DATE,
          defaultValue: sequelize.fn('NOW'),
        },
        updated_at: {
          allowNull: false,
          type: DataTypes.DATE,
          defaultValue: sequelize.fn('NOW'),
        },
      },
      { transaction }
    );

    await queryInterface.addConstraint('class', {
      fields: ['course_id', 'class_name'],
      type: 'unique',
      transaction,
    });

    await queryInterface.createTable(
      'course_teacher',
      {
        course_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          references: {
            model: 'course',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        teacher_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          references: {
            model: 'teacher',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        created_at: {
          allowNull: false,
          type: DataTypes.DATE,
          defaultValue: sequelize.fn('NOW'),
        },
        updated_at: {
          allowNull: false,
          type: DataTypes.DATE,
          defaultValue: sequelize.fn('NOW'),
        },
      },
      { transaction }
    );

    await queryInterface.createTable(
      'user_class',
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: DataTypes.INTEGER,
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'user',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        class_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'class',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        join_time: {
          allowNull: false,
          type: DataTypes.DATE,
          defaultValue: sequelize.fn('NOW'),
        },
        status: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
        },
        created_at: {
          allowNull: false,
          type: DataTypes.DATE,
          defaultValue: sequelize.fn('NOW'),
        },
        updated_at: {
          allowNull: false,
          type: DataTypes.DATE,
          defaultValue: sequelize.fn('NOW'),
        },
      },
      { transaction }
    );

    await queryInterface.addConstraint('user_class', {
      fields: ['user_id', 'class_id'],
      type: 'unique',
      transaction,
    });

    await queryInterface.createTable(
      'time_slot',
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: DataTypes.INTEGER,
        },
        course_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'course',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        week_day: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        start_time: {
          type: DataTypes.STRING(10),
          allowNull: false,
        },
        end_time: {
          type: DataTypes.STRING(10),
          allowNull: false,
        },
        location: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        created_at: {
          allowNull: false,
          type: DataTypes.DATE,
          defaultValue: sequelize.fn('NOW'),
        },
        updated_at: {
          allowNull: false,
          type: DataTypes.DATE,
          defaultValue: sequelize.fn('NOW'),
        },
      },
      { transaction }
    );

    await queryInterface.createTable(
      'attendance_task',
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: DataTypes.INTEGER,
        },
        course_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'course',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        start_time: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        end_time: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        status: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
        },
        created_at: {
          allowNull: false,
          type: DataTypes.DATE,
          defaultValue: sequelize.fn('NOW'),
        },
        updated_at: {
          allowNull: false,
          type: DataTypes.DATE,
          defaultValue: sequelize.fn('NOW'),
        },
      },
      { transaction }
    );

    await queryInterface.createTable(
      'attendance_record',
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: DataTypes.INTEGER,
        },
        task_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'attendance_task',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'user',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        checkin_time: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        status: {
          type: DataTypes.STRING(50),
          allowNull: false,
          defaultValue: 'present',
        },
        ip_address: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        device_info: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        created_at: {
          allowNull: false,
          type: DataTypes.DATE,
          defaultValue: sequelize.fn('NOW'),
        },
        updated_at: {
          allowNull: false,
          type: DataTypes.DATE,
          defaultValue: sequelize.fn('NOW'),
        },
      },
      { transaction }
    );

    await queryInterface.addConstraint('attendance_record', {
      fields: ['task_id', 'user_id'],
      type: 'unique',
      transaction,
    });
  });
}

export async function down(): Promise<void> {
  const sequelize = getSequelize();
  const queryInterface: QueryInterface = sequelize.getQueryInterface();

  await sequelize.transaction(async transaction => {
    await queryInterface.dropTable('attendance_record', { transaction });
    await queryInterface.dropTable('attendance_task', { transaction });
    await queryInterface.dropTable('time_slot', { transaction });
    await queryInterface.dropTable('user_class', { transaction });
    await queryInterface.dropTable('course_teacher', { transaction });
    await queryInterface.dropTable('class', { transaction });
    await queryInterface.dropTable('course', { transaction });
    await queryInterface.dropTable('teacher', { transaction });
  });
}
