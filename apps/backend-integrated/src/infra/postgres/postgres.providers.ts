import type { Provider } from '@nestjs/common';
import { Sequelize } from 'sequelize';
import { loadModelsAndAssociations } from './loadModels';

async function createSequelizeInstance(): Promise<{
  sequelize: Sequelize;
  models: Record<string, any>;
}> {
  const database = process.env.DB_NAME ?? 'csisp';
  const username = process.env.DB_USER ?? 'admin';
  const password = process.env.DB_PASSWORD ?? 'replace-me';
  const host = process.env.DB_HOST ?? 'localhost';
  const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : 5433;

  const sequelize = new Sequelize(database, username, password, {
    host,
    port,
    dialect: 'postgres',
    logging: false,
  });

  // 先验证连接可用性
  await sequelize.authenticate();

  // 再加载当前项目内的所有模型并建立关联
  const models = await loadModelsAndAssociations(sequelize);

  return { sequelize, models };
}

export const POSTGRES_SEQUELIZE = 'POSTGRES_SEQUELIZE';
export const POSTGRES_MODELS = 'POSTGRES_MODELS';

export const postgresProviders: Provider[] = [
  {
    provide: POSTGRES_SEQUELIZE,
    useFactory: async () => {
      const { sequelize } = await createSequelizeInstance();
      return sequelize;
    },
  },
  {
    provide: POSTGRES_MODELS,
    useFactory: async () => {
      const { models } = await createSequelizeInstance();
      return models;
    },
  },
];
