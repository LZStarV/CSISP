import { loadRootEnv } from '@csisp/utils';

import { getInfraDbLogger } from '../logger';

import { seedBaseData } from './base-data';
import { seedIdp } from './idp';

loadRootEnv();
const logger = getInfraDbLogger();

async function main() {
  logger.info('开始执行统一种子任务');
  await seedBaseData();
  await seedIdp();
  logger.info('统一种子任务完成');
}

main().catch(err => {
  logger.error({ error: err?.message }, '统一种子任务执行失败');
  process.exit(1);
});
