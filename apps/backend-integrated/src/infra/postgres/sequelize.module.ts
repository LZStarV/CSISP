import { requireEnv } from '@csisp/utils';
import { Module } from '@nestjs/common';
import {
  SequelizeModule,
  type SequelizeModuleOptions,
} from '@nestjs/sequelize';

import { POSTGRES_MODELS } from './models';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      useFactory: (): SequelizeModuleOptions =>
        ({
          dialect: 'postgres',
          uri: requireEnv('DATABASE_URL'),
          logging: false,
          models: [...POSTGRES_MODELS],
          autoLoadModels: false,
          synchronize: false,
        }) as SequelizeModuleOptions,
    }),
    SequelizeModule.forFeature([...POSTGRES_MODELS]),
  ],
  exports: [SequelizeModule],
})
export class SequelizePostgresModule {}
