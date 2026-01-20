import path from 'path';
import { spawnSync } from 'child_process';
import { loadRootEnv } from '@csisp/utils';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadRootEnv();

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
const result = spawnSync(kanelBin, ['-d', connectionString, '-o', 'src/db/generated'], {
  stdio: 'inherit',
});

process.exitCode = result.status ?? 0;
