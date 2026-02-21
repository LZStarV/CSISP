import { config } from '@config';
import { Sequelize } from 'sequelize';

let sequelizeInstance: Sequelize | null = null;

export function getSequelize(): Sequelize {
  if (sequelizeInstance) return sequelizeInstance;

  sequelizeInstance = new Sequelize(config.db.url, {
    dialect: 'postgres',
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
