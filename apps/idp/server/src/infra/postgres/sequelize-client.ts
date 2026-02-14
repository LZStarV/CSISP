import { requireEnv } from '@csisp/utils';
import { Sequelize } from 'sequelize';

let sequelizeInstance: Sequelize | null = null;

function getEnv(name: string, def?: string): string | undefined {
  return process.env[name] ?? def;
}

export function getSequelize(): Sequelize {
  if (sequelizeInstance) return sequelizeInstance;

  const url = getEnv('IDP_DB_URL') ?? requireEnv('DATABASE_URL');
  sequelizeInstance = new Sequelize(url, {
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
