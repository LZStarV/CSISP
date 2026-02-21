import { IdpAuthModule } from '@csisp/auth/server';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { config } from './config';
import { SequelizePostgresModule } from './infra/postgres/sequelize.module';
import { DomainModules } from './modules';

@Module({
  imports: [
    IdpAuthModule.register({
      idp: {
        url: config.auth.idpThriftUrl,
      },
      auth: {
        jwtSecret: config.auth.jwtSecret,
      },
    }),
    SequelizePostgresModule,
    MongooseModule.forRoot(config.mongo.uri, {
      dbName: config.mongo.dbName,
    }),
    ...DomainModules,
  ],
})
export class AppModule {}
