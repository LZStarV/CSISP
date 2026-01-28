import { join } from 'path';

import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';

import { SequelizePostgresModule } from './infra/postgres/sequelize.module';
import { RedisModule } from './infra/redis/redis.module';
import { DomainModules } from './modules';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../../client/dist'),
      serveRoot: '/',
    }),
    SequelizePostgresModule,
    RedisModule,
    ...DomainModules,
  ],
})
export class AppModule {}
