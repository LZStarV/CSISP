import { Umzug, SequelizeStorage } from 'umzug';
import type { QueryInterface } from 'sequelize';
import { getSequelize, closeSequelize } from './sequelize-client';
import { getInfraDbLogger } from './logger';

function createUmzug(): Umzug<QueryInterface> {
  const sequelize = getSequelize();
  const queryInterface = sequelize.getQueryInterface();
  const logger = getInfraDbLogger();

  return new Umzug<QueryInterface>({
    migrations: {
      glob: 'src/migrations/*.ts',
    },
    context: queryInterface,
    storage: new SequelizeStorage({
      sequelize,
      tableName: 'schema_migrations',
    }),
    logger: {
      info: (message: unknown) => logger.info(message),
      warn: (message: unknown) => logger.warn(message),
      error: (message: unknown) => logger.error(message),
      debug: (message: unknown) => logger.debug(message),
    },
  });
}

export async function migrateUpAll() {
  const umzug = createUmzug();
  await umzug.up();
}

export async function migrateDownOne() {
  const umzug = createUmzug();
  await umzug.down();
}

export async function migrateStatus() {
  const umzug = createUmzug();
  const executed = await umzug.executed();
  const pending = await umzug.pending();
  return {
    executed: executed.map((migration: { name: string }) => migration.name),
    pending: pending.map((migration: { name: string }) => migration.name),
  };
}

export { closeSequelize };
