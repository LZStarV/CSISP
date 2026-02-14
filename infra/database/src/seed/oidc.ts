import crypto from 'crypto';

import { requireEnv } from '@csisp/utils';
import type OidcClients from '@pgtype/OidcClients';
import type OidcKeys from '@pgtype/OidcKeys';
import type { QueryInterface } from 'sequelize';

import { getInfraDbLogger } from '../logger';
import { getSequelize, closeSequelize } from '../sequelize-client';

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
  const kek = requireEnv('OIDC_KEK_SECRET');
  const defaultClientId = requireEnv('CSISP_OIDC_DEFAULT_CLIENT_ID');
  const rpcPrefix = requireEnv('CSISP_RPC_PREFIX');
  const bffRedirect = `${requireEnv('CSISP_BFF_URL')}${rpcPrefix}/bff/callback`;
  const backofficeRedirect = `${requireEnv('CSISP_BACKOFFICE_URL')}${rpcPrefix}/auth/callback`;
  const allowedRedirects = [bffRedirect, backofficeRedirect];

  await sequelize.transaction(async transaction => {
    const existingKeys: Array<Partial<OidcKeys>> = (await sequelize.query(
      'SELECT kid FROM "oidc_keys";',
      {
        type: 'SELECT',
        transaction,
      }
    )) as any;
    const hasKeys = existingKeys.length > 0;
    if (!hasKeys) {
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
            private_pem_enc: enc.toString('base64'),
            status: 'active',
            created_at: new Date(),
          },
        ],
        { transaction }
      );
      logger.info({ kid }, 'seed oidc key inserted');
    } else {
      logger.info('oidc key exists, skip insert');
    }

    const existingClient: Array<Partial<OidcClients>> = (await sequelize.query(
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
            name: 'CSISP BFF',
            allowed_redirect_uris: redirectsJson,
            scopes: scopesJson,
            status: 'active',
            created_at: new Date(),
            updated_at: new Date(),
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

    const backofficeClientId = 'backoffice';
    const existingBackoffice: Array<Partial<OidcClients>> =
      (await sequelize.query(
        'SELECT client_id FROM "oidc_clients" WHERE client_id = :cid;',
        {
          type: 'SELECT',
          transaction,
          replacements: { cid: backofficeClientId },
        }
      )) as any;
    if (existingBackoffice.length === 0) {
      const redirectsJson = JSON.stringify([backofficeRedirect]);
      const scopesJson = JSON.stringify(['openid', 'profile', 'email']);
      await qi.bulkInsert(
        'oidc_clients',
        [
          {
            client_id: backofficeClientId,
            client_secret: null,
            name: 'CSISP Backoffice',
            allowed_redirect_uris: redirectsJson,
            scopes: scopesJson,
            status: 'active',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );
      logger.info(
        { client_id: backofficeClientId },
        'seed oidc client backoffice inserted'
      );
    }
  });

  await closeSequelize();
}
