import { config } from '@config';
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
          uri: config.db.url,
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
