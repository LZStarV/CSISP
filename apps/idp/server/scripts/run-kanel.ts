import { spawnSync } from 'child_process';
import path from 'path';

import { loadRootEnv } from '@csisp/utils';

import { createLogger } from '../src/infra/logger';

loadRootEnv();
process.env.LOG_TO_FILE = process.env.LOG_TO_FILE ?? 'false';

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || '5433';
const database = process.env.DB_NAME || 'csisp';
const user = process.env.DB_USER || 'postgres';
const password = process.env.DB_PASSWORD || 'postgres';
const connectionString =
  process.env.IDP_DB_URL ||
  `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;

const kanelBin = path.resolve(__dirname, '..', 'node_modules', '.bin', 'kanel');
const result = spawnSync(
  kanelBin,
  ['-d', connectionString, '-o', 'src/infra/postgres/generated'],
  {
    stdio: 'inherit',
  }
);

if (result.error) {
  const logger = createLogger('idp-server-codegen');
  logger.error({ err: result.error }, 'kanel execution failed');
  process.exitCode = 1;
} else {
  process.exitCode = result.status ?? 0;
}
