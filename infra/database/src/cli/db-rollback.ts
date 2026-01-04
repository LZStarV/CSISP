import { migrateDownOne, closeSequelize } from '../migration-runner';
import { loadRootEnv } from '../config/load-env';
import { getInfraDbLogger } from '../logger';

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
