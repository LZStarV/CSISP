import { spawnSync } from 'child_process';
import path from 'path';

import { requireEnv } from '@csisp/utils';

import { getInfraDbLogger } from '../logger';

async function main(): Promise<void> {
  const logger = getInfraDbLogger();

  const connectionString = requireEnv('DATABASE_URL');

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
