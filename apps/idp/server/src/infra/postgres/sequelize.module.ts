import { requireEnv } from '@csisp/utils';
import { Module } from '@nestjs/common';
import {
  SequelizeModule,
  type SequelizeModuleOptions,
} from '@nestjs/sequelize';

import { POSTGRES_MODELS } from './models';

function buildOptions(): SequelizeModuleOptions {
  const url = process.env.IDP_DB_URL ?? requireEnv('DATABASE_URL');
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

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      useFactory: (): SequelizeModuleOptions => buildOptions(),
    }),
    SequelizeModule.forFeature([...POSTGRES_MODELS]),
  ],
  exports: [SequelizeModule],
})
export class SequelizePostgresModule {}
