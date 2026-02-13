import { IdpAuthModule } from '@csisp/auth/server';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { SequelizePostgresModule } from './infra/postgres/sequelize.module';
import { DomainModules } from './modules';

@Module({
  imports: [
    IdpAuthModule.register({
      idp: {
        url: process.env.IDP_THRIFT_URL || 'http://localhost:9090',
      },
      auth: {
        jwtSecret: process.env.JWT_SECRET || 'default-secret',
      },
    }),
    SequelizePostgresModule,
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017',
      {
        dbName: process.env.MONGODB_DB || 'csisp',
      }
    ),
    ...DomainModules,
  ],
})
export class AppModule {}
