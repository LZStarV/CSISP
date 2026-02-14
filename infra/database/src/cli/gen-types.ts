import { spawnSync } from 'child_process';
import path from 'path';

import { getInfraDbLogger } from '../logger';

async function main(): Promise<void> {
  const logger = getInfraDbLogger();

  // 1. 获取数据库连接字符串 (参考 run-kanel.ts 的逻辑)
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5433';
  const database = process.env.DB_NAME || 'csisp';
  const user = process.env.DB_USER || 'admin';
  const password = process.env.DB_PASSWORD || 'replace-me';

  const connectionString =
    process.env.DATABASE_URL ||
    `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;

  const outDir = path.resolve(process.cwd(), 'dist');

  logger.info({ outDir }, '正在基于当前数据库生成集中类型包...');

  // 2. 执行 kanel
  const result = spawnSync(
    'pnpm',
    ['exec', 'kanel', '-d', connectionString, '-o', outDir],
    {
      stdio: 'inherit',
      shell: true,
    }
  );

  if (result.error || result.status !== 0) {
    logger.error(
      { err: result.error, status: result.status },
      'Kanel 执行失败'
    );
    process.exit(1);
  }

  logger.info('集中类型包生成完成');
}

void main();
