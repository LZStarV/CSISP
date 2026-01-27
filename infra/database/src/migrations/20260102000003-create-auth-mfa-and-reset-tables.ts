import type { QueryInterface } from 'sequelize';
import { DataTypes } from 'sequelize';
import { getSequelize } from '../sequelize-client';
import { loadRootEnv } from '@csisp/utils';

loadRootEnv();
export async function up(): Promise<void> {
  const sequelize = getSequelize();
  const queryInterface: QueryInterface = sequelize.getQueryInterface();

  await sequelize.transaction(async transaction => {
    // 表：mfa_settings（用户多因子认证配置）
    await queryInterface.createTable(
      'mfa_settings',
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
          // 用户ID，外键，关联 user 表
          onDelete: 'CASCADE',
        },
        sms_enabled: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          // 是否启用短信作为多因子
        },
        email_enabled: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          // 是否启用邮箱作为多因子
        },
        fido2_enabled: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          // 是否启用 FIDO2/WebAuthn 作为多因子
        },
        otp_enabled: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          // 是否启用 TOTP（一次性密码）作为多因子
        },
        phone_number: {
          type: DataTypes.STRING(20),
          allowNull: true,
          // 绑定用于短信验证的手机号（可选）
        },
        required: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          // 是否强制进行多因子认证
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
    await queryInterface.addConstraint('mfa_settings', {
      fields: ['user_id'],
      type: 'unique',
      name: 'mfa_settings_user_unique',
      transaction,
    });

    // 表：password_resets（用户重置密码令牌）
    await queryInterface.createTable(
      'password_resets',
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
          // 用户ID，外键，关联 user 表
          onDelete: 'CASCADE',
        },
        token_hash: {
          type: DataTypes.STRING(255),
          allowNull: false,
          // 重置令牌的哈希值（只存储哈希，避免泄露）
        },
        expires_at: {
          type: DataTypes.DATE,
          allowNull: false,
          // 重置令牌过期时间
        },
        used: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          // 是否已使用（true 表示令牌已消费）
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
    await queryInterface.addIndex('password_resets', ['user_id'], {
      name: 'password_resets_user_idx',
      transaction,
    });
    await queryInterface.addIndex('password_resets', ['expires_at'], {
      name: 'password_resets_expires_idx',
      transaction,
    });
  });
}

export async function down(): Promise<void> {
  const sequelize = getSequelize();
  const queryInterface: QueryInterface = sequelize.getQueryInterface();

  await sequelize.transaction(async transaction => {
    await queryInterface.dropTable('password_resets', { transaction });
    await queryInterface.dropTable('mfa_settings', { transaction });
  });
}
