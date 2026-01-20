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
      'academic_config',
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: DataTypes.INTEGER,
        },
        year: {
          type: DataTypes.STRING(10),
          allowNull: false,
        },
        semester: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        start_date: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        end_date: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        is_current: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        status: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
        },
      },
      { transaction }
    );

    await queryInterface.createTable(
      'sub_course',
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
        sub_course_code: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
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
        academic_year: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        status: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
        },
      },
      { transaction }
    );

    await queryInterface.createTable(
      'schedule',
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: DataTypes.INTEGER,
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
        weekday: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        time_slot_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'time_slot',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        room: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        location: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
      },
      { transaction }
    );

    await queryInterface.createTable(
      'homework',
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: DataTypes.INTEGER,
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
        title: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        content: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        deadline: {
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
      'homework_submission',
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: DataTypes.INTEGER,
        },
        homework_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'homework',
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
        file_path: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        file_name: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        content: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        status: {
          type: DataTypes.STRING(20),
          allowNull: false,
          defaultValue: 'submitted',
        },
        submit_time: {
          type: DataTypes.DATE,
          allowNull: false,
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

    await queryInterface.addConstraint('homework_submission', {
      fields: ['homework_id', 'user_id'],
      type: 'unique',
      name: 'homework_submission_homework_user_unique',
      transaction,
    });

    await queryInterface.createTable(
      'homework_file',
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: DataTypes.INTEGER,
        },
        submission_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'homework_submission',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        file_name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        file_path: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        file_size: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        file_type: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        upload_time: {
          type: DataTypes.DATE,
          allowNull: false,
        },
      },
      { transaction }
    );

    await queryInterface.createTable(
      'notification',
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: DataTypes.INTEGER,
        },
        type: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        title: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        content: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        target_user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'user',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        sender_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'user',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        status: {
          type: DataTypes.STRING(20),
          allowNull: false,
          defaultValue: 'unread',
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
      'permission',
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: DataTypes.INTEGER,
        },
        name: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
        },
        code: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
        },
        description: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        status: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
        },
      },
      { transaction }
    );

    await queryInterface.createTable(
      'role_permission',
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: DataTypes.INTEGER,
        },
        role_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'role',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        permission_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'permission',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
      },
      { transaction }
    );

    await queryInterface.createTable(
      'course_rep',
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
        responsibility: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        appointment_date: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        status: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
        },
      },
      { transaction }
    );
  });
}

export async function down(): Promise<void> {
  const sequelize = getSequelize();
  const queryInterface: QueryInterface = sequelize.getQueryInterface();

  await sequelize.transaction(async transaction => {
    await queryInterface.dropTable('course_rep', { transaction });
    await queryInterface.dropTable('role_permission', { transaction });
    await queryInterface.dropTable('permission', { transaction });
    await queryInterface.dropTable('notification', { transaction });
    await queryInterface.dropTable('homework_file', { transaction });
    await queryInterface.dropTable('homework_submission', { transaction });
    await queryInterface.dropTable('homework', { transaction });
    await queryInterface.dropTable('schedule', { transaction });
    await queryInterface.dropTable('sub_course', { transaction });
    await queryInterface.dropTable('academic_config', { transaction });
  });
}
