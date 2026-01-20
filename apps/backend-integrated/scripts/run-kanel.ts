import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import dotenv from 'dotenv';
import { createLogger } from '../src/infra/logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');
dotenv.config({ path: path.join(rootDir, '.env') });
dotenv.config({ path: path.join(rootDir, 'apps/backend-integrated/.env') });
process.env.LOG_TO_FILE = process.env.LOG_TO_FILE ?? 'false';

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || '5433';
const database = process.env.DB_NAME || 'csisp';
const user = process.env.DB_USER || 'admin';
const password = process.env.DB_PASSWORD || 'replace-me';

const connectionString =
  process.env.DATABASE_URL ||
  `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;

const kanelBin = path.resolve(__dirname, '..', 'node_modules', '.bin', 'kanel');
const result = spawnSync(kanelBin, ['-d', connectionString, '-o', 'src/infra/postgres/generated'], {
  stdio: 'inherit',
});

if (result.error) {
  const logger = createLogger('backend-integrated-codegen');
  logger.error({ err: result.error }, 'kanel execution failed');
  process.exitCode = 1;
} else {
  process.exitCode = result.status ?? 0;
}
