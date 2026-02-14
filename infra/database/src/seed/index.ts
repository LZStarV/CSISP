import { getInfraDbLogger } from '../logger';

import { seedBaseData } from './base-data';
import { seedIdp } from './idp';
import { seedOidc } from './oidc';

const logger = getInfraDbLogger();

async function main() {
  logger.info('开始执行数据库种子填充...');
  await seedBaseData();
  await seedIdp();
  await seedOidc();
  logger.info('数据库种子填充完成');
}

main().catch(err => {
  const logger = getInfraDbLogger();
  logger.error({ error: err?.message }, '数据库种子填充失败');
  process.exit(1);
});
