import { IdpAuthModule } from '@csisp/auth/server';
import { requireEnv } from '@csisp/utils';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { SequelizePostgresModule } from './infra/postgres/sequelize.module';
import { DomainModules } from './modules';

@Module({
  imports: [
    IdpAuthModule.register({
      idp: {
        url: requireEnv('CSISP_IDP_THRIFT_URL'),
      },
      auth: {
        jwtSecret: requireEnv('JWT_SECRET'),
      },
    }),
    SequelizePostgresModule,
    MongooseModule.forRoot(requireEnv('MONGODB_URI'), {
      dbName: requireEnv('MONGODB_DB'),
    }),
    ...DomainModules,
  ],
})
export class AppModule {}
