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
          host: process.env.DB_HOST ?? 'localhost',
          port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5433,
          database: process.env.DB_NAME ?? 'csisp',
          username: process.env.DB_USER ?? 'admin',
          password: process.env.DB_PASSWORD ?? 'replace-me',
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
