import crypto from 'crypto';

import { loadRootEnv } from '@csisp/utils';
import type { QueryInterface } from 'sequelize';
import { literal } from 'sequelize';

import { getInfraDbLogger } from '../logger';
import { getSequelize, closeSequelize } from '../sequelize-client';

loadRootEnv();
const logger = getInfraDbLogger();

function deriveKey(secret: string): Buffer {
  return crypto.createHash('sha256').update(secret).digest();
}

function encryptPrivatePem(pem: string, kek: string): Buffer {
  const key = deriveKey(kek);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(Buffer.from(pem)), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]);
}

export async function seedOidc(): Promise<void> {
  const sequelize = getSequelize();
  const qi: QueryInterface = sequelize.getQueryInterface();
  const kek = process.env.OIDC_KEK_SECRET || 'dev-kek';
  const defaultClientId = process.env.OIDC_DEFAULT_CLIENT_ID || 'csisp-bff';
  let allowedRedirects: string[] | null = null;
  const redirectsEnv = process.env.OIDC_DEFAULT_REDIRECT_URIS;
  if (redirectsEnv) {
    try {
      const arr = JSON.parse(redirectsEnv);
      if (Array.isArray(arr) && arr.length > 0) {
        allowedRedirects = arr.filter(x => typeof x === 'string');
      }
    } catch {}
  }
  if (!allowedRedirects) {
    const single = process.env.OIDC_DEFAULT_REDIRECT_URI;
    if (single) {
      allowedRedirects = [single];
    } else {
      allowedRedirects = [
        'http://localhost:4000/api/bff/callback',
        'http://localhost:3000/api/backoffice/callback',
      ];
    }
  }

  await sequelize.transaction(async transaction => {
    const existingKeys: Array<{ kid: string; status: string }> =
      (await sequelize.query('SELECT kid, status FROM "oidc_keys";', {
        type: 'SELECT',
        transaction,
      })) as any;
    const hasActive = existingKeys.some(k => k.status === 'active');
    if (!hasActive) {
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
      });
      const enc = encryptPrivatePem(privateKey, kek);
      const kid = crypto.randomUUID();
      await qi.bulkInsert(
        'oidc_keys',
        [
          {
            kid,
            kty: 'RSA',
            alg: 'RS256',
            use: 'sig',
            public_pem: publicKey,
            private_pem_enc: enc,
            status: 'active',
            activated_at: new Date(),
            created_at: new Date(),
          },
        ],
        { transaction }
      );
      logger.info({ kid }, 'seed oidc key inserted');
    } else {
      logger.info('active oidc key exists, skip insert');
    }

    const existingClient: Array<{ client_id: string }> = (await sequelize.query(
      'SELECT client_id FROM "oidc_clients" WHERE client_id = :cid;',
      {
        type: 'SELECT',
        transaction,
        replacements: { cid: defaultClientId },
      }
    )) as any;
    if (existingClient.length === 0) {
      const redirectsJson = JSON.stringify(allowedRedirects);
      const scopesJson = JSON.stringify(['openid', 'profile', 'email']);
      await qi.bulkInsert(
        'oidc_clients',
        [
          {
            client_id: defaultClientId,
            client_secret: null,
            name: 'CSISP BFF Client',
            allowed_redirect_uris: literal(`'${redirectsJson}'::jsonb`),
            scopes: literal(`'${scopesJson}'::jsonb`),
            status: 'active',
            created_by: 'seed',
            created_at: new Date(),
          },
        ],
        { transaction }
      );
      logger.info({ client_id: defaultClientId }, 'seed oidc client inserted');
    } else {
      logger.info(
        { client_id: defaultClientId },
        'oidc client exists, skip insert'
      );
    }
  });

  await closeSequelize();
}
