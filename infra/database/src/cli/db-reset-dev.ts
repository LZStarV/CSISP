import { Umzug } from 'umzug';
import type { QueryInterface } from 'sequelize';
import { getSequelize, closeSequelize } from '../sequelize-client';
import { getInfraDbLogger } from '../logger';
import { loadRootEnv } from '../config/load-env';

function createUmzug(): Umzug<QueryInterface> {
  const sequelize = getSequelize();
  const queryInterface = sequelize.getQueryInterface();
  const logger = getInfraDbLogger();

  return new Umzug<QueryInterface>({
    migrations: {
      glob: 'src/migrations/*.ts',
    },
    context: queryInterface,
    storage: undefined,
    logger: {
      info: (message: unknown) => logger.info(message),
      warn: (message: unknown) => logger.warn(message),
      error: (message: unknown) => logger.error(message),
      debug: (message: unknown) => logger.debug(message),
    },
  });
}

async function main() {
  loadRootEnv();
  const logger = getInfraDbLogger();
  try {
    const umzug = createUmzug();
    await umzug.down({ to: 0 });
    await umzug.up();
    logger.info('Development database reset completed.');
  } catch (e) {
    logger.error({ err: e }, 'Development database reset failed');
    process.exitCode = 1;
  } finally {
    await closeSequelize();
  }
}

void main();
