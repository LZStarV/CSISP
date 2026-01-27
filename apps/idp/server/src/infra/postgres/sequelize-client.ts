import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

dotenv.config();

let sequelizeInstance: Sequelize | null = null;

function getEnv(name: string, def?: string): string | undefined {
  return process.env[name] ?? def;
}

export function getSequelize(): Sequelize {
  if (sequelizeInstance) return sequelizeInstance;

  const url = getEnv('IDP_DB_URL');
  if (url) {
    sequelizeInstance = new Sequelize(url, {
      dialect: 'postgres',
      logging: false,
      define: { underscored: true },
      timezone: '+08:00',
    });
    return sequelizeInstance;
  }

  const host = getEnv('DB_HOST', 'localhost')!;
  const port = Number(getEnv('DB_PORT', '5433'));
  const database = getEnv('DB_NAME', 'csisp')!;
  const username = getEnv('DB_USER', 'postgres')!;
  const password = getEnv('DB_PASSWORD', 'postgres')!;

  sequelizeInstance = new Sequelize({
    dialect: 'postgres',
    host,
    port,
    database,
    username,
    password,
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
