const path = require('path');
const { spawnSync } = require('child_process');
const dotenv = require('dotenv');

const rootDir = path.resolve(__dirname, '..', '..');

dotenv.config({ path: path.join(rootDir, '.env') });
dotenv.config({ path: path.join(rootDir, 'apps/backend-integrated/.env') });

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
  import('@csisp/logger')
    .then(mod => {
      const logger = mod.createLogger('backend-integrated-codegen');
      logger.error({ err: result.error }, 'kanel execution failed');
    })
    .catch(() => {
      // fallback logging if logger import fails
      // eslint-disable-next-line no-console
      console.error(result.error);
    })
    .finally(() => {
      process.exit(1);
    });
} else {
  process.exit(result.status ?? 0);
}
