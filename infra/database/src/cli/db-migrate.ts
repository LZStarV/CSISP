import { loadRootEnv } from '@csisp/utils';

import { getInfraDbLogger } from '../logger';
import { migrateUpAll, closeSequelize } from '../migration-runner';

async function main() {
  loadRootEnv();
  const logger = getInfraDbLogger();
  try {
    await migrateUpAll();
    logger.info('Database migrations applied successfully.');
  } catch (e) {
    logger.error({ err: e }, 'Database migration failed');
    process.exitCode = 1;
  } finally {
    await closeSequelize();
  }
}

void main();
