import { Sequelize } from 'sequelize';
import { getDbConfig } from './config/db-env';

let sequelizeInstance: Sequelize | null = null;

export function getSequelize(): Sequelize {
  if (sequelizeInstance) return sequelizeInstance;

  const cfg = getDbConfig();

  sequelizeInstance = new Sequelize({
    dialect: 'postgres',
    host: cfg.host,
    port: cfg.port,
    database: cfg.database,
    username: cfg.username,
    password: cfg.password,
    logging: false,
    define: { underscored: true },
    timezone: '+08:00',
  });

  return sequelizeInstance;
}

export async function closeSequelize(): Promise<void> {
  if (!sequelizeInstance) return;
  await sequelizeInstance.close();
  sequelizeInstance = null;
}
