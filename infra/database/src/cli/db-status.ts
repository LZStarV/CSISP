import { loadRootEnv } from '@csisp/utils';

import { getInfraDbLogger } from '../logger';
import { migrateStatus, closeSequelize } from '../migration-runner';

async function main() {
  loadRootEnv();
  const logger = getInfraDbLogger();
  try {
    const status = await migrateStatus();
    logger.info({ executed: status.executed }, 'Executed migrations');
    logger.info({ pending: status.pending }, 'Pending migrations');
  } catch (e) {
    logger.error({ err: e }, 'Failed to get migration status');
    process.exitCode = 1;
  } finally {
    await closeSequelize();
  }
}

void main();
