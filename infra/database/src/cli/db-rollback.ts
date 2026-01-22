import { loadRootEnv } from '@csisp/utils';

import { getInfraDbLogger } from '../logger';
import { migrateDownOne, closeSequelize } from '../migration-runner';

async function main() {
  loadRootEnv();
  const logger = getInfraDbLogger();
  try {
    await migrateDownOne();
    logger.info('Rolled back last migration.');
  } catch (e) {
    logger.error({ err: e }, 'Database rollback failed');
    process.exitCode = 1;
  } finally {
    await closeSequelize();
  }
}

void main();
