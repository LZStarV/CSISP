import type { QueryInterface } from 'sequelize';
import { DataTypes } from 'sequelize';
import { getSequelize } from '../sequelize-client';
import { loadRootEnv } from '@csisp/utils';

loadRootEnv();

export async function up(): Promise<void> {
  const sequelize = getSequelize();
  const qi: QueryInterface = sequelize.getQueryInterface();

  await sequelize.transaction(async transaction => {
    // 表：oidc_keys（OIDC 签名密钥元数据；私钥需加密入库）
    await qi.createTable(
      'oidc_keys',
      {
        kid: {
          type: DataTypes.STRING(128),
          allowNull: false,
          primaryKey: true,
          comment: 'Key ID',
        },
        kty: {
          type: DataTypes.STRING(16),
          allowNull: false,
          comment: 'Key type，如 RSA/ECDSA',
        },
        alg: {
          type: DataTypes.STRING(16),
          allowNull: false,
          comment: '签名算法，如 RS256/ES256',
        },
        use: {
          type: DataTypes.STRING(8),
          allowNull: false,
          comment: '用途，如 sig',
        },
        public_pem: {
          type: DataTypes.TEXT,
          allowNull: false,
          comment: '公钥（PEM 或 JWK 序列化）',
        },
        private_pem_enc: {
          type: DataTypes.BLOB,
          allowNull: false,
          comment: '加密后的私钥（AES-GCM 等）',
        },
        status: {
          type: DataTypes.STRING(16),
          allowNull: false,
          defaultValue: 'active',
          comment: '状态：active/retired/compromised',
        },
        activated_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        expires_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: sequelize.fn('NOW'),
        },
        rotated_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      { transaction }
    );
    await qi.addIndex('oidc_keys', ['status'], {
      name: 'oidc_keys_status_idx',
      transaction,
    });
    await qi.addIndex('oidc_keys', ['activated_at'], {
      name: 'oidc_keys_activated_idx',
      transaction,
    });

    // 表：oidc_clients（OIDC 客户端注册与回调白名单）
    await qi.createTable(
      'oidc_clients',
      {
        client_id: {
          type: DataTypes.STRING(128),
          allowNull: false,
          primaryKey: true,
        },
        client_secret: {
          type: DataTypes.STRING(256),
          allowNull: true,
          comment: '保留字段；Public Client 可为空',
        },
        name: {
          type: DataTypes.STRING(128),
          allowNull: true,
        },
        allowed_redirect_uris: {
          type: DataTypes.JSONB,
          allowNull: false,
          comment: '精确匹配的回调白名单（数组）',
        },
        scopes: {
          type: DataTypes.JSONB,
          allowNull: false,
          comment: '允许的授权范围（数组）',
        },
        status: {
          type: DataTypes.STRING(16),
          allowNull: false,
          defaultValue: 'active',
        },
        created_by: {
          type: DataTypes.STRING(64),
          allowNull: true,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: sequelize.fn('NOW'),
        },
      },
      { transaction }
    );
    await qi.addIndex('oidc_clients', ['status'], {
      name: 'oidc_clients_status_idx',
      transaction,
    });
    await qi.addIndex('oidc_clients', ['allowed_redirect_uris'], {
      name: 'oidc_clients_redirects_idx',
      using: 'GIN',
      transaction,
    });
  });
}

export async function down(): Promise<void> {
  const sequelize = getSequelize();
  const qi: QueryInterface = sequelize.getQueryInterface();
  await sequelize.transaction(async transaction => {
    await qi.dropTable('oidc_clients', { transaction });
    await qi.dropTable('oidc_keys', { transaction });
  });
}
