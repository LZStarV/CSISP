import { config } from '@config';
import { Module } from '@nestjs/common';
import {
  SequelizeModule,
  type SequelizeModuleOptions,
} from '@nestjs/sequelize';

import { POSTGRES_MODELS } from './models';

function buildOptions(): SequelizeModuleOptions {
  return {
    dialect: 'postgres',
    uri: config.db.url,
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
