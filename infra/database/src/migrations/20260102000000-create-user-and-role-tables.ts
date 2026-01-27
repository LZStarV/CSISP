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
      'user',
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: DataTypes.INTEGER,
        },
        username: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
        },
        password: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        real_name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        student_id: {
          type: DataTypes.STRING(11),
          allowNull: false,
          unique: true,
        },
        enrollment_year: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        major: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        status: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
        },
        weak_password_flag: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: true,
          unique: true,
        },
        phone: {
          type: DataTypes.STRING(20),
          allowNull: true,
          unique: true,
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
      'role',
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
          type: DataTypes.TEXT,
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
      'user_role',
      {
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'user',
            key: 'id',
          },
          onDelete: 'CASCADE',
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

    await queryInterface.addConstraint('user_role', {
      fields: ['user_id', 'role_id'],
      type: 'primary key',
      name: 'user_role_pk',
      transaction,
    });
  });
}

export async function down(): Promise<void> {
  const sequelize = getSequelize();
  const queryInterface: QueryInterface = sequelize.getQueryInterface();

  await sequelize.transaction(async transaction => {
    await queryInterface.dropTable('user_role', { transaction });
    await queryInterface.dropTable('role', { transaction });
    await queryInterface.dropTable('user', { transaction });
  });
}
