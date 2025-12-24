import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');

const envPath = path.resolve(rootDir, '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function run(cmd, args, env = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', shell: true, env: { ...process.env, ...env } });
    p.on('exit', code => {
      if (code === 0) resolve();
      else reject(new Error(String(code)));
    });
  });
}

async function main() {
  const action = process.argv[2] || '';
  const env = {
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: process.env.DB_PORT || '5433',
    DB_USER: process.env.DB_USER || 'admin',
    DB_PASSWORD: process.env.DB_PASSWORD || 'password',
    DB_NAME: process.env.DB_NAME || 'csisp',
  };
  const workflowsDir = path.resolve(__dirname, '..');
  const configPath = path.resolve(__dirname, 'sequelize-config.cjs');
  const migrationsPath = path.resolve(__dirname, 'migrations');
  const seedersPath = path.resolve(__dirname, 'seeders');
  if (action === 'migrate') {
    await run(
      'pnpm',
      [
        'exec',
        'sequelize-cli',
        'db:migrate',
        `--config=${configPath}`,
        `--migrations-path=${migrationsPath}`,
      ],
      env,
      workflowsDir
    );
  } else if (action === 'seed') {
    await run(
      'pnpm',
      [
        'exec',
        'sequelize-cli',
        'db:seed:all',
        `--config=${configPath}`,
        `--seeders-path=${seedersPath}`,
      ],
      env,
      workflowsDir
    );
  } else {
    process.stderr.write('Usage: node cli.mjs [migrate|seed]\n');
    process.exit(1);
  }
}

main().catch(err => {
  process.stderr.write(String(err) + '\n');
  process.exit(1);
});
