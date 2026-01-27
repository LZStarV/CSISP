import { Module } from '@nestjs/common';
import {
  SequelizeModule,
  type SequelizeModuleOptions,
} from '@nestjs/sequelize';

import { POSTGRES_MODELS } from './models';

function buildOptions(): SequelizeModuleOptions {
  const url = process.env.IDP_DB_URL;
  if (url) {
    return {
      dialect: 'postgres',
      uri: url,
      logging: false,
      models: [...POSTGRES_MODELS],
      autoLoadModels: false,
      synchronize: false,
      define: { underscored: true },
      timezone: '+08:00',
    } as SequelizeModuleOptions;
  }
  const host = process.env.DB_HOST ?? 'localhost';
  const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : 5433;
  const database = process.env.DB_NAME ?? 'csisp';
  const username = process.env.DB_USER ?? 'postgres';
  const password = process.env.DB_PASSWORD ?? 'postgres';
  return {
    dialect: 'postgres',
    host,
    port,
    database,
    username,
    password,
    logging: false,
    models: [...POSTGRES_MODELS],
    autoLoadModels: false,
    synchronize: false,
    define: { underscored: true },
    timezone: '+08:00',
  } as SequelizeModuleOptions;
}

@Module({
  imports: [
    SequelizeModule.forRoot(buildOptions()),
    SequelizeModule.forFeature([...POSTGRES_MODELS]),
  ],
  exports: [SequelizeModule],
})
export class SequelizePostgresModule {}
