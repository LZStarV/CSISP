import { Sequelize } from 'sequelize-typescript';

import { getDbConfig } from './config/db-env';
import { getInfraDbLogger } from './logger';

let sequelize: Sequelize | null = null;

export function getSequelize(): Sequelize {
  if (sequelize) return sequelize;

  const cfg = getDbConfig();
  const logger = getInfraDbLogger();

  sequelize = new Sequelize({
    dialect: 'postgres',
    host: cfg.host,
    port: cfg.port,
    database: cfg.database,
    username: cfg.username,
    password: cfg.password,
    logging: (msg: string) => logger.debug(msg),
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });

  return sequelize;
}

export async function closeSequelize(): Promise<void> {
  if (sequelize) {
    await sequelize.close();
    sequelize = null;
  }
}
